"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Send, Users, MessageSquare, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { adminFetch } from "@/lib/admin-fetch"
import { useToast } from "@/hooks/use-toast"

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

interface MessageStats {
  totalSent: number
  successRate: number
  lastSentAt: string | null
  totalRecipients: number
}

const DEFAULT_TEMPLATES = {
  teacherProfile: {
    subject: "Please complete your teacher profile",
    body: "Hi {name},\n\nWe noticed your teacher profile is missing some important details ({missingFields}). A complete profile helps students find and connect with you.\n\nPlease log in and update your profile at your earliest convenience.\n\nThanks,\nToki Connect Team",
  },
  welcome: {
    subject: "Welcome to Toki Connect!",
    body: "Hi {name},\n\nWelcome to Toki Connect! We're excited to have you on board.\n\nGet started by completing your profile and exploring available features.\n\nBest regards,\nToki Connect Team",
  },
  announcement: {
    subject: "Important Update from Toki Connect",
    body: "Hi {name},\n\nWe have an important update to share with you.\n\n[Add your announcement here]\n\nThank you,\nToki Connect Team",
  },
}

export default function MessagesPage() {
  const { toast } = useToast()

  // Group messaging state
  const [groupRole, setGroupRole] = useState("teacher")
  const [groupStatus, setGroupStatus] = useState("all")
  const [groupMissingProfile, setGroupMissingProfile] = useState("all")
  const [groupLanguage, setGroupLanguage] = useState("all")
  const [groupSubject, setGroupSubject] = useState(DEFAULT_TEMPLATES.teacherProfile.subject)
  const [groupBody, setGroupBody] = useState(DEFAULT_TEMPLATES.teacherProfile.body)
  const [groupSending, setGroupSending] = useState(false)
  const [groupPreviewCount, setGroupPreviewCount] = useState<number | null>(null)
  const [groupPreviewLoading, setGroupPreviewLoading] = useState(false)
  const [lastSendResult, setLastSendResult] = useState<BulkSendResult | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  // Individual message state
  const [individualEmail, setIndividualEmail] = useState("")
  const [individualSubject, setIndividualSubject] = useState("")
  const [individualBody, setIndividualBody] = useState("")
  const [individualSending, setIndividualSending] = useState(false)
  const [individualUserId, setIndividualUserId] = useState<string | null>(null)
  const [individualLookupLoading, setIndividualLookupLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState<MessageStats>({
    totalSent: 0,
    successRate: 100,
    lastSentAt: null,
    totalRecipients: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])

  useEffect(() => {
    loadStats()
    loadLanguages()
  }, [])

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const response = await adminFetch("/api/admin/users/message/bulk")
      const data = await response.json().catch(() => ({}))
      if (response.ok && data?.report) {
        const r = data.report
        const sent = Number(r.sentCount || 0)
        const total = Number(r.totalRecipients || 0)
        setStats({
          totalSent: sent,
          successRate: total > 0 ? Math.round((sent / total) * 100) : 100,
          lastSentAt: r.sentAt || null,
          totalRecipients: total,
        })
        setLastSendResult({
          sentCount: sent,
          failedCount: Number(r.failedCount || 0),
          messageLoggedCount: Number(r.messageLoggedCount || 0),
          totalRecipients: total,
          sentRecipients: Array.isArray(r.sentRecipients) ? r.sentRecipients : [],
          failedRecipients: Array.isArray(r.failedRecipients) ? r.failedRecipients : [],
        })
      }
    } catch {
      // non-critical
    } finally {
      setStatsLoading(false)
    }
  }

  const loadLanguages = async () => {
    try {
      const response = await adminFetch("/api/admin/languages/stats")
      const data = await response.json().catch(() => ({}))
      if (data?.teachersByLanguage) {
        const langs = Object.entries(data.teachersByLanguage)
          .filter(([, count]) => Number(count) > 0)
          .map(([lang]) => lang.charAt(0).toUpperCase() + lang.slice(1))
          .sort()
        setAvailableLanguages(langs)
      }
    } catch {
      // non-critical
    }
  }

  const previewRecipients = async () => {
    setGroupPreviewLoading(true)
    setGroupPreviewCount(null)
    try {
      const params = new URLSearchParams({ role: groupRole, status: groupStatus, previewOnly: "true" })
      if (groupMissingProfile !== "all") params.set("missingProfile", groupMissingProfile)
      if (groupLanguage !== "all") params.set("language", groupLanguage.toLowerCase())
      const response = await adminFetch(`/api/admin/users/message/bulk?${params}`)
      const data = await response.json().catch(() => ({}))
      setGroupPreviewCount(Number(data?.recipientCount ?? data?.count ?? 0))
    } catch {
      toast({ title: "Preview failed", description: "Could not estimate recipient count", variant: "destructive" })
    } finally {
      setGroupPreviewLoading(false)
    }
  }

  const handleApplyTemplate = (key: keyof typeof DEFAULT_TEMPLATES) => {
    setGroupSubject(DEFAULT_TEMPLATES[key].subject)
    setGroupBody(DEFAULT_TEMPLATES[key].body)
  }

  const handleSendGroupMessage = () => {
    if (!groupSubject.trim() || !groupBody.trim()) {
      toast({ title: "Missing fields", description: "Subject and message body are required.", variant: "destructive" })
      return
    }
    setConfirmDialogOpen(true)
  }

  const confirmSend = async () => {
    setConfirmDialogOpen(false)
    setGroupSending(true)
    try {
      const payload: Record<string, string> = {
        role: groupRole,
        status: groupStatus,
        subject: groupSubject,
        message: groupBody,
      }
      if (groupMissingProfile !== "all") payload.missingProfile = groupMissingProfile
      if (groupLanguage !== "all") payload.language = groupLanguage.toLowerCase()

      const response = await adminFetch("/api/admin/users/message/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to send group message")

      const result: BulkSendResult = {
        sentCount: Number(data.sentCount || 0),
        failedCount: Number(data.failedCount || 0),
        messageLoggedCount: Number(data.messageLoggedCount || 0),
        totalRecipients: Number(data.totalRecipients || 0),
        sentRecipients: Array.isArray(data.sentRecipients) ? data.sentRecipients : [],
        failedRecipients: Array.isArray(data.failedRecipients) ? data.failedRecipients : [],
      }
      setLastSendResult(result)
      toast({
        title: "Message sent",
        description: `Sent to ${result.sentCount} recipient${result.sentCount !== 1 ? "s" : ""}${result.failedCount > 0 ? `. ${result.failedCount} failed.` : "."}`,
      })
      loadStats()
    } catch (error) {
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setGroupSending(false)
    }
  }

  const lookupUserByEmail = async () => {
    if (!individualEmail.trim()) return
    setIndividualLookupLoading(true)
    setIndividualUserId(null)
    try {
      const response = await adminFetch(`/api/admin/users?search=${encodeURIComponent(individualEmail)}&pageSize=1`)
      const data = await response.json().catch(() => ({}))
      const users = data.users || data.data || []
      if (users.length > 0) {
        setIndividualUserId(users[0].id)
        toast({ title: "User found", description: `Found: ${users[0].first_name} ${users[0].last_name}` })
      } else {
        toast({ title: "Not found", description: "No user found with that email", variant: "destructive" })
      }
    } catch {
      toast({ title: "Lookup failed", variant: "destructive" })
    } finally {
      setIndividualLookupLoading(false)
    }
  }

  const handleSendIndividual = async () => {
    if (!individualUserId) {
      toast({ title: "User not found", description: "Look up the user by email first", variant: "destructive" })
      return
    }
    if (!individualSubject.trim() || !individualBody.trim()) {
      toast({ title: "Missing fields", description: "Subject and message are required", variant: "destructive" })
      return
    }
    setIndividualSending(true)
    try {
      const response = await adminFetch("/api/admin/users/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: individualUserId, subject: individualSubject, message: individualBody }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to send")
      toast({ title: "Message sent", description: `Your message has been sent to ${individualEmail}` })
      setIndividualEmail("")
      setIndividualSubject("")
      setIndividualBody("")
      setIndividualUserId(null)
    } catch (error) {
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIndividualSending(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Send group messages and individual communications to platform users.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Last Batch Sent</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalSent}</div>
                <p className="text-xs text-muted-foreground">messages delivered</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Delivery Rate</span>
                </div>
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                <p className="text-xs text-muted-foreground">of last batch</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Recipients</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalRecipients}</div>
                <p className="text-xs text-muted-foreground">in last batch</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Last Sent</span>
                </div>
                <div className="text-sm font-medium">
                  {stats.lastSentAt ? new Date(stats.lastSentAt).toLocaleDateString() : "—"}
                </div>
                <p className="text-xs text-muted-foreground">date of last batch</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="group" className="space-y-6">
        <TabsList>
          <TabsTrigger value="group">Group Message</TabsTrigger>
          <TabsTrigger value="individual">Individual Message</TabsTrigger>
          {lastSendResult && <TabsTrigger value="report">Last Send Report</TabsTrigger>}
        </TabsList>

        {/* GROUP MESSAGE TAB */}
        <TabsContent value="group" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recipient Filters</CardTitle>
                <CardDescription>Define who receives this message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Send To</Label>
                  <Select value={groupRole} onValueChange={(v) => { setGroupRole(v); setGroupPreviewCount(null) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="student">All Students</SelectItem>
                      <SelectItem value="teacher">All Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={groupStatus} onValueChange={(v) => { setGroupStatus(v); setGroupPreviewCount(null) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={groupLanguage} onValueChange={(v) => { setGroupLanguage(v); setGroupPreviewCount(null) }}>
                    <SelectTrigger><SelectValue placeholder="All Languages" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Missing Profile Fields</Label>
                  <Select value={groupMissingProfile} onValueChange={(v) => { setGroupMissingProfile(v); setGroupPreviewCount(null) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Anyone</SelectItem>
                      <SelectItem value="language">Missing Language</SelectItem>
                      <SelectItem value="price">Missing Price / Rate</SelectItem>
                      <SelectItem value="bio">Missing Bio</SelectItem>
                      <SelectItem value="language,price">Missing Language &amp; Price</SelectItem>
                      <SelectItem value="language,bio">Missing Language &amp; Bio</SelectItem>
                      <SelectItem value="language,price,bio">Missing All Fields</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={previewRecipients}
                  disabled={groupPreviewLoading}
                >
                  {groupPreviewLoading ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Counting...</>
                  ) : (
                    "Preview Recipient Count"
                  )}
                </Button>

                {groupPreviewCount !== null && (
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{groupPreviewCount}</strong> recipient{groupPreviewCount !== 1 ? "s" : ""} match the selected filters.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Compose */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Compose Message</CardTitle>
                      <CardDescription>
                        Use {"{name}"}, {"{email}"}, {"{role}"}, {"{missingFields}"} as placeholders
                      </CardDescription>
                    </div>
                    <Select onValueChange={(v) => handleApplyTemplate(v as keyof typeof DEFAULT_TEMPLATES)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Use template..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacherProfile">Complete Profile</SelectItem>
                        <SelectItem value="welcome">Welcome Message</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-subject">Subject</Label>
                    <Input
                      id="group-subject"
                      value={groupSubject}
                      onChange={(e) => setGroupSubject(e.target.value)}
                      placeholder="Message subject..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-body">Message Body</Label>
                    <Textarea
                      id="group-body"
                      value={groupBody}
                      onChange={(e) => setGroupBody(e.target.value)}
                      rows={12}
                      placeholder="Write your message here..."
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
                      onClick={handleSendGroupMessage}
                      disabled={groupSending}
                    >
                      {groupSending ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" />Send Group Message</>
                      )}
                    </Button>
                    {groupPreviewCount !== null && (
                      <span className="text-sm text-muted-foreground">
                        Will send to <strong>{groupPreviewCount}</strong> recipient{groupPreviewCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* INDIVIDUAL MESSAGE TAB */}
        <TabsContent value="individual">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Send to Individual User</CardTitle>
              <CardDescription>Look up a user by email then compose your message</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Find User by Email</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="user@example.com"
                    value={individualEmail}
                    onChange={(e) => { setIndividualEmail(e.target.value); setIndividualUserId(null) }}
                    type="email"
                  />
                  <Button
                    variant="outline"
                    onClick={lookupUserByEmail}
                    disabled={individualLookupLoading || !individualEmail.trim()}
                  >
                    {individualLookupLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Find"}
                  </Button>
                </div>
                {individualUserId && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> User found — ready to send
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={individualSubject}
                  onChange={(e) => setIndividualSubject(e.target.value)}
                  placeholder="Message subject..."
                  disabled={!individualUserId}
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={individualBody}
                  onChange={(e) => setIndividualBody(e.target.value)}
                  rows={8}
                  placeholder="Write your message here..."
                  disabled={!individualUserId}
                />
              </div>

              <Button
                className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
                onClick={handleSendIndividual}
                disabled={individualSending || !individualUserId}
              >
                {individualSending ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Send Message</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORT TAB */}
        {lastSendResult && (
          <TabsContent value="report" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-600">{lastSendResult.sentCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">Successfully Sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-red-500">{lastSendResult.failedCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">Failed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">{lastSendResult.messageLoggedCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">Logged to Inbox</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold">{lastSendResult.totalRecipients}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total Recipients</p>
                </CardContent>
              </Card>
            </div>

            {lastSendResult.failedRecipients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" /> Failed Recipients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastSendResult.failedRecipients.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.email}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{r.reason || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {lastSendResult.sentRecipients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Sent Recipients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastSendResult.sentRecipients.slice(0, 100).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.email}</TableCell>
                          <TableCell><Badge variant="outline">{r.role}</Badge></TableCell>
                        </TableRow>
                      ))}
                      {lastSendResult.sentRecipients.length > 100 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">
                            …and {lastSendResult.sentRecipients.length - 100} more
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Group Message</DialogTitle>
            <DialogDescription>
              You are about to send a group message to{" "}
              {groupPreviewCount !== null ? (
                <strong>{groupPreviewCount} recipient{groupPreviewCount !== 1 ? "s" : ""}</strong>
              ) : (
                "all matching users"
              )}
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm bg-muted rounded-md p-3">
            <div>
              <span className="text-muted-foreground">To: </span>
              {groupRole === "all" ? "All Users" : groupRole === "teacher" ? "All Teachers" : "All Students"}
              {groupLanguage !== "all" ? ` — ${groupLanguage}` : ""}
            </div>
            <div><span className="text-muted-foreground">Subject: </span>{groupSubject}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={confirmSend}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
