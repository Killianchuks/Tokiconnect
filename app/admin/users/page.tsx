"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, AlertCircle, RefreshCw, MessageSquare, Trash2, Send } from "lucide-react"
import { adminFetch } from "@/lib/admin-fetch"
import { useToast } from "@/hooks/use-toast"
import { LanguageSearch } from "@/components/language-search"

interface User {
  id: string
  name?: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  created_at: string
  language?: string
  hourly_rate?: number
  bio?: string
}

interface ApiResponse {
  success: boolean
  users?: User[]
  data?: User[] | { users: User[] }
  pagination?: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  message?: string
  error?: string
}

interface BulkRecipient {
  id: string
  email: string
  name: string
  role?: string
  missingFields?: string
  reason?: string
}

interface BulkSendResult {
  sentCount: number
  failedCount: number
  messageLoggedCount: number
  totalRecipients: number
  sentRecipients: BulkRecipient[]
  failedRecipients: BulkRecipient[]
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const reportSectionRef = useRef<HTMLDivElement | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [missingProfileFilter, setMissingProfileFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [messageUser, setMessageUser] = useState<User | null>(null)
  const [messageSubject, setMessageSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [submittingMessage, setSubmittingMessage] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [bulkRoleFilter, setBulkRoleFilter] = useState("teacher")
  const [bulkStatusFilter, setBulkStatusFilter] = useState("all")
  const [bulkMissingProfileFilter, setBulkMissingProfileFilter] = useState("language")
  const [bulkSubject, setBulkSubject] = useState("Please complete your profile")
  const [bulkMessageTemplate, setBulkMessageTemplate] = useState(
    "Hi {name},\n\nPlease complete your profile details. We noticed your account is missing: {missingFields}.\n\nThanks,\nToki Admin",
  )
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewRecipientCount, setPreviewRecipientCount] = useState<number | null>(null)
  const [lastBulkResult, setLastBulkResult] = useState<BulkSendResult | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("adminUsersLastBulkReport")
      if (!saved) return

      const parsed = JSON.parse(saved)
      if (!parsed || typeof parsed !== "object") return

      setLastBulkResult({
        sentCount: Number(parsed.sentCount || 0),
        failedCount: Number(parsed.failedCount || 0),
        messageLoggedCount: Number(parsed.messageLoggedCount || 0),
        totalRecipients: Number(parsed.totalRecipients || 0),
        sentRecipients: Array.isArray(parsed.sentRecipients) ? parsed.sentRecipients : [],
        failedRecipients: Array.isArray(parsed.failedRecipients) ? parsed.failedRecipients : [],
      })
    } catch {
      // Ignore invalid cached report payloads.
    }
  }, [])

  useEffect(() => {
    const loadLastBulkReport = async () => {
      try {
        const response = await adminFetch("/api/admin/users/message/bulk")
        const data = await response.json().catch(() => ({}))

        if (!response.ok || !data?.report) return

        setLastBulkResult({
          sentCount: Number(data.report.sentCount || 0),
          failedCount: Number(data.report.failedCount || 0),
          messageLoggedCount: Number(data.report.messageLoggedCount || 0),
          totalRecipients: Number(data.report.totalRecipients || 0),
          sentRecipients: Array.isArray(data.report.sentRecipients) ? data.report.sentRecipients : [],
          failedRecipients: Array.isArray(data.report.failedRecipients) ? data.report.failedRecipients : [],
        })
      } catch {
        // Ignore report-loading errors and keep page functional.
      }
    }

    loadLastBulkReport()
  }, [])

  const fetchUsers = async (overrides?: {
    searchQuery?: string
    roleFilter?: string
    statusFilter?: string
    missingProfileFilter?: string
    languageFilter?: string
    page?: number
    pageSize?: number
  }) => {
    const effectiveSearchQuery = overrides?.searchQuery ?? searchQuery
    const effectiveRoleFilter = overrides?.roleFilter ?? roleFilter
    const effectiveStatusFilter = overrides?.statusFilter ?? statusFilter
    const effectiveMissingProfileFilter = overrides?.missingProfileFilter ?? missingProfileFilter
    const effectiveLanguageFilter = overrides?.languageFilter ?? languageFilter
    const effectivePage = overrides?.page ?? currentPage
    const effectivePageSize = overrides?.pageSize ?? pageSize

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (effectiveSearchQuery.trim()) params.set("search", effectiveSearchQuery.trim())
      if (effectiveRoleFilter !== "all") params.set("role", effectiveRoleFilter)
      if (effectiveStatusFilter !== "all") params.set("status", effectiveStatusFilter)
      if (effectiveMissingProfileFilter !== "all") {
        params.set("missingProfile", effectiveMissingProfileFilter.replaceAll("_", ","))
      }
      if (effectiveLanguageFilter !== "all") params.set("language", effectiveLanguageFilter)
      params.set("page", String(effectivePage))
      params.set("pageSize", String(effectivePageSize))
      const query = params.toString() ? `?${params.toString()}` : ""

      const response = await adminFetch(`/api/admin/users${query}`)
      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`)
      }

      let data: ApiResponse
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error(`Failed to parse JSON response: ${parseError}`)
      }

      console.log("Parsed data:", data)

      // Handle different response formats
      let userList: User[] = []

      if (Array.isArray(data)) {
        userList = data
      } else if (data.users && Array.isArray(data.users)) {
        userList = data.users
      } else if (data.data) {
        if (Array.isArray(data.data)) {
          userList = data.data
        } else if (typeof data.data === "object" && data.data.users && Array.isArray(data.data.users)) {
          userList = data.data.users
        }
      }

      // If we still don't have users, try to find any array property
      if (userList.length === 0 && typeof data === "object" && data !== null) {
        const arrayProperties = Object.entries(data).filter(([_, value]) => Array.isArray(value))
        if (arrayProperties.length > 0) {
          const [key, value] = arrayProperties[0]
          userList = value as User[]
          console.warn(`Admin users: loaded from fallback array property data.${key}`)
        }
      }

      setUsers(userList)

      if (data.pagination) {
        setCurrentPage(data.pagination.page || effectivePage)
        setPageSize(data.pagination.pageSize || effectivePageSize)
        setTotalCount(data.pagination.totalCount || 0)
        setTotalPages(data.pagination.totalPages || 1)
      } else {
        setCurrentPage(effectivePage)
        setPageSize(effectivePageSize)
        setTotalCount(userList.length)
        setTotalPages(1)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      console.error("Error fetching users:", err)
      setError(errorMessage)
      setUsers([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const openMessageDialog = (user: User) => {
    setMessageUser(user)
    setMessageSubject("Support follow-up")
    setMessageBody("")
    setIsMessageDialogOpen(true)
  }

  const handleSendMessage = async () => {
    if (!messageUser) return

    if (!messageSubject.trim() || !messageBody.trim()) {
      toast({
        title: "Missing fields",
        description: "Subject and message are required.",
        variant: "destructive",
      })
      return
    }

    setSubmittingMessage(true)
    try {
      const response = await adminFetch("/api/admin/users/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: messageUser.id,
          subject: messageSubject,
          message: messageBody,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      toast({
        title: "Message sent",
        description: `Your message has been sent to ${messageUser.email}.`,
      })

      setIsMessageDialogOpen(false)
      setMessageUser(null)
      setMessageSubject("")
      setMessageBody("")
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSubmittingMessage(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    const confirmed = window.confirm(`Delete ${user.email}? This cannot be undone.`)
    if (!confirmed) return

    setDeletingUserId(user.id)
    try {
      const response = await adminFetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user")
      }

      const nextPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      await fetchUsers({ page: nextPage })
      toast({ title: "User deleted", description: `${user.email} was removed.` })
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setDeletingUserId(null)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSearch = () => {
    fetchUsers({ page: 1 })
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setRoleFilter("all")
    setStatusFilter("all")
    setMissingProfileFilter("all")
    setLanguageFilter("all")
    fetchUsers({ searchQuery: "", roleFilter: "all", statusFilter: "all", missingProfileFilter: "all", languageFilter: "all", page: 1 })
  }

  const parseMissingFields = (value: string) => {
    if (!value || value === "all") return []
    return value.split("_").filter((field) => field === "language" || field === "price" || field === "bio")
  }

  const handleSendBulkMessage = async () => {
    if (!bulkSubject.trim() || !bulkMessageTemplate.trim()) {
      toast({
        title: "Missing fields",
        description: "Subject and message template are required.",
        variant: "destructive",
      })
      return
    }

    const missingFields = parseMissingFields(bulkMissingProfileFilter)
    if (missingFields.length === 0) {
      toast({
        title: "Missing criteria",
        description: "Select at least one missing profile field.",
        variant: "destructive",
      })
      return
    }

    setBulkSubmitting(true)
    try {
      const response = await adminFetch("/api/admin/users/message/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: bulkRoleFilter,
          status: bulkStatusFilter,
          search: searchQuery,
          missingFields,
          subject: bulkSubject,
          messageTemplate: bulkMessageTemplate,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Failed to send bulk messages")
      }

      toast({
        title: "Bulk messages sent",
        description: `Sent ${data.sentCount || 0} message(s). Failed: ${data.failedCount || 0}. Logged replies: ${data.messageLoggedCount || 0}.`,
      })

      setLastBulkResult({
        sentCount: Number(data.sentCount || 0),
        failedCount: Number(data.failedCount || 0),
        messageLoggedCount: Number(data.messageLoggedCount || 0),
        totalRecipients: Number(data.totalRecipients || 0),
        sentRecipients: Array.isArray(data.sentRecipients) ? data.sentRecipients : [],
        failedRecipients: Array.isArray(data.failedRecipients) ? data.failedRecipients : [],
      })

      try {
        localStorage.setItem(
          "adminUsersLastBulkReport",
          JSON.stringify({
            sentCount: Number(data.sentCount || 0),
            failedCount: Number(data.failedCount || 0),
            messageLoggedCount: Number(data.messageLoggedCount || 0),
            totalRecipients: Number(data.totalRecipients || 0),
            sentRecipients: Array.isArray(data.sentRecipients) ? data.sentRecipients : [],
            failedRecipients: Array.isArray(data.failedRecipients) ? data.failedRecipients : [],
          }),
        )
      } catch {
        // Ignore storage failures.
      }

      setIsBulkDialogOpen(false)
    } catch (err) {
      toast({
        title: "Bulk send failed",
        description: err instanceof Error ? err.message : "Failed to send bulk messages",
        variant: "destructive",
      })
    } finally {
      setBulkSubmitting(false)
    }
  }

  const handlePreviewRecipients = async () => {
    const missingFields = parseMissingFields(bulkMissingProfileFilter)
    if (missingFields.length === 0) {
      toast({
        title: "Missing criteria",
        description: "Select at least one missing profile field.",
        variant: "destructive",
      })
      return
    }

    setPreviewLoading(true)
    try {
      const response = await adminFetch("/api/admin/users/message/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: bulkRoleFilter,
          status: bulkStatusFilter,
          search: searchQuery,
          missingFields,
          subject: bulkSubject || "Preview",
          messageTemplate: bulkMessageTemplate || "Preview",
          previewOnly: true,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Failed to preview recipients")
      }

      setPreviewRecipientCount(Number(data.totalRecipients || 0))
      toast({
        title: "Preview ready",
        description: `${Number(data.totalRecipients || 0)} user(s) match your current bulk filters.`,
      })
    } catch (err) {
      toast({
        title: "Preview failed",
        description: err instanceof Error ? err.message : "Failed to preview recipients",
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleRowsPerPageChange = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) return

    const clamped = Math.max(1, Math.min(parsed, 1000))
    fetchUsers({ page: 1, pageSize: clamped })
  }

  const handlePreviousPage = () => {
    if (currentPage <= 1) return
    fetchUsers({ page: currentPage - 1 })
  }

  const handleNextPage = () => {
    if (currentPage >= totalPages) return
    fetchUsers({ page: currentPage + 1 })
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "N/A"
      return date.toLocaleDateString()
    } catch {
      return "N/A"
    }
  }

  const canMessageUser = (user: User) => {
    const role = String(user.role || "").toLowerCase()
    return role === "student" || role === "teacher"
  }

  const canDeleteUser = (user: User) => {
    const role = String(user.role || "").toLowerCase()
    return role !== "admin"
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "destructive"
      case "teacher":
        return "default"
      case "student":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage platform users and their roles</p>
        </div>
        <div className="flex items-center gap-2">
          {lastBulkResult ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => reportSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              View Last Report
            </Button>
          ) : null}
          <Button onClick={() => setIsBulkDialogOpen(true)} size="sm">
            <Send className="h-4 w-4 mr-2" />
            Bulk Message
          </Button>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_150px_150px_180px_150px_auto_auto]">
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={missingProfileFilter} onValueChange={setMissingProfileFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Missing Profile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Profile State</SelectItem>
            <SelectItem value="language">Missing Language</SelectItem>
            <SelectItem value="price">Missing Price</SelectItem>
            <SelectItem value="bio">Missing Bio</SelectItem>
            <SelectItem value="language_price">Missing Language + Price</SelectItem>
            <SelectItem value="language_bio">Missing Language + Bio</SelectItem>
            <SelectItem value="price_bio">Missing Price + Bio</SelectItem>
            <SelectItem value="language_price_bio">Missing Language + Price + Bio</SelectItem>
          </SelectContent>
        </Select>
        <LanguageSearch
          value={languageFilter === "all" ? "" : languageFilter}
          onChange={(value) => setLanguageFilter(value || "all")}
          placeholder="Search language..."
          className="w-full"
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="ghost" onClick={handleResetFilters}>
          Reset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((user) => user.is_active).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((user) => user.role === "teacher").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all platform users</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="rows-per-page" className="text-sm text-muted-foreground whitespace-nowrap">
                Rows per page
              </Label>
              <Input
                id="rows-per-page"
                type="number"
                min={1}
                max={1000}
                value={pageSize}
                onChange={(e) => handleRowsPerPageChange(e.target.value)}
                className="w-24"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Error loading users: {error}</AlertDescription>
            </Alert>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">There are no users in the system yet.</p>
              <Button onClick={fetchUsers}>Refresh</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {(user as any).name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.language || "-"}</TableCell>
                      <TableCell>{user.hourly_rate ? `$${user.hourly_rate}` : "-"}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canMessageUser(user) ? (
                            <Button size="sm" variant="outline" onClick={() => openMessageDialog(user)}>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          ) : null}
                          {canDeleteUser(user) ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deletingUserId === user.id}
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {deletingUserId === user.id ? "Deleting..." : "Delete"}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Protected</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
                <p className="text-muted-foreground">
                  Showing {users.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} users
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage <= 1 || loading}>
                    Previous
                  </Button>
                  <span className="text-muted-foreground">Page {currentPage} of {Math.max(totalPages, 1)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {lastBulkResult ? (
        <div ref={reportSectionRef}>
          <Card>
          <CardHeader>
            <CardTitle>Last Bulk Message Report</CardTitle>
            <CardDescription>
              Total matched: {lastBulkResult.totalRecipients}. Sent: {lastBulkResult.sentCount}. Failed: {lastBulkResult.failedCount}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Recipients Who Received Message</h3>
              {lastBulkResult.sentRecipients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No successful recipients in the last run.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Missing Fields</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastBulkResult.sentRecipients.map((recipient) => (
                        <TableRow key={`sent-${recipient.id}-${recipient.email}`}>
                          <TableCell>{recipient.name}</TableCell>
                          <TableCell>{recipient.email}</TableCell>
                          <TableCell>{recipient.role || "-"}</TableCell>
                          <TableCell>{recipient.missingFields || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {lastBulkResult.failedRecipients.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold mb-2">Failed Recipients</h3>
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastBulkResult.failedRecipients.map((recipient, index) => (
                        <TableRow key={`failed-${recipient.id}-${recipient.email}-${index}`}>
                          <TableCell>{recipient.name}</TableCell>
                          <TableCell>{recipient.email}</TableCell>
                          <TableCell>{recipient.reason || "Unknown error"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}
          </CardContent>
          </Card>
        </div>
      ) : null}

      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Message User</DialogTitle>
            <DialogDescription>
              Send a support message to {messageUser?.email || "this user"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message-subject">Subject</Label>
              <Input
                id="message-subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="Subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message-body">Message</Label>
              <Textarea
                id="message-body"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Write your message..."
                className="min-h-[140px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)} disabled={submittingMessage}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={submittingMessage}>
              {submittingMessage ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Send Bulk Profile Completion Message</DialogTitle>
            <DialogDescription>
              Send personalized messages to users missing selected profile fields. Available tokens: {"{name}"}, {"{email}"}, {"{role}"}, {"{missingFields}"}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={bulkRoleFilter} onValueChange={setBulkRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={bulkStatusFilter} onValueChange={setBulkStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Missing Profile</Label>
              <Select value={bulkMissingProfileFilter} onValueChange={setBulkMissingProfileFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Missing Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="language">Missing Language</SelectItem>
                  <SelectItem value="price">Missing Price</SelectItem>
                  <SelectItem value="bio">Missing Bio</SelectItem>
                  <SelectItem value="language_price">Missing Language + Price</SelectItem>
                  <SelectItem value="language_bio">Missing Language + Bio</SelectItem>
                  <SelectItem value="price_bio">Missing Price + Bio</SelectItem>
                  <SelectItem value="language_price_bio">Missing Language + Price + Bio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-subject">Subject</Label>
            <Input
              id="bulk-subject"
              value={bulkSubject}
              onChange={(e) => setBulkSubject(e.target.value)}
              placeholder="Profile completion reminder"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-message">Message Template</Label>
            <Textarea
              id="bulk-message"
              value={bulkMessageTemplate}
              onChange={(e) => setBulkMessageTemplate(e.target.value)}
              className="min-h-[180px]"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {previewRecipientCount === null
              ? "Preview recipient count before sending."
              : `${previewRecipientCount} recipient(s) currently match these filters.`}
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)} disabled={bulkSubmitting}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handlePreviewRecipients} disabled={bulkSubmitting || previewLoading}>
              {previewLoading ? "Checking..." : "Preview Recipients"}
            </Button>
            <Button onClick={handleSendBulkMessage} disabled={bulkSubmitting}>
              {bulkSubmitting ? "Sending..." : "Send Bulk Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
