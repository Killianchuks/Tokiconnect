"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, UserPlus, Database, AlertCircle, RefreshCw } from "lucide-react"
import { adminFetch } from "@/lib/admin-fetch"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  created_at: string
  language?: string
  hourly_rate?: number
}

interface ApiResponse {
  success: boolean
  users?: User[]
  data?: User[] | { users: User[] }
  message?: string
  error?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      setDebugInfo("Fetching users...")

      const response = await adminFetch("/api/admin/users")
      const responseText = await response.text()

      console.log("Raw response:", responseText)
      setDebugInfo(`Response status: ${response.status}, Raw response length: ${responseText.length}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`)
      }

      let data: ApiResponse
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        setDebugInfo(`JSON parse error: ${parseError}. Raw response: ${responseText.substring(0, 200)}...`)
        throw new Error(`Failed to parse JSON response: ${parseError}`)
      }

      console.log("Parsed data:", data)

      // Handle different response formats
      let userList: User[] = []

      if (Array.isArray(data)) {
        userList = data
        setDebugInfo(`Loaded ${data.length} users from direct array`)
      } else if (data.users && Array.isArray(data.users)) {
        userList = data.users
        setDebugInfo(`Loaded ${data.users.length} users from data.users`)
      } else if (data.data) {
        if (Array.isArray(data.data)) {
          userList = data.data
          setDebugInfo(`Loaded ${data.data.length} users from data.data array`)
        } else if (typeof data.data === "object" && data.data.users && Array.isArray(data.data.users)) {
          userList = data.data.users
          setDebugInfo(`Loaded ${data.data.users.length} users from data.data.users`)
        }
      }

      // If we still don't have users, try to find any array property
      if (userList.length === 0 && typeof data === "object" && data !== null) {
        const arrayProperties = Object.entries(data).filter(([_, value]) => Array.isArray(value))
        if (arrayProperties.length > 0) {
          const [key, value] = arrayProperties[0]
          userList = value as User[]
          setDebugInfo(`Loaded ${userList.length} users from data.${key} (found array property)`)
        }
      }

      if (userList.length === 0) {
        setDebugInfo(`No users found. Response structure: ${JSON.stringify(Object.keys(data || {}), null, 2)}`)
      }

      setUsers(userList)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      console.error("Error fetching users:", err)
      setError(errorMessage)
      setDebugInfo(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const checkUsers = async () => {
    try {
      const response = await fetch("/api/debug/list-all-users")
      const data = await response.json()
      console.log("Debug users check:", data)
      setDebugInfo(`Debug check: Found ${data.users?.length || 0} users in database`)
    } catch (err) {
      console.error("Debug check failed:", err)
      setDebugInfo(`Debug check failed: ${err}`)
    }
  }

  const checkDbStatus = async () => {
    try {
      const response = await fetch("/api/debug/db-status")
      const data = await response.json()
      console.log("DB Status:", data)
      setDebugInfo(`DB Status: ${data.status}, Tables: ${data.tables?.join(", ") || "none"}`)
    } catch (err) {
      console.error("DB status check failed:", err)
      setDebugInfo(`DB status check failed: ${err}`)
    }
  }

  const createTestUser = async () => {
    try {
      const testUser = {
        email: `test${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
        password: "password123",
        role: "student",
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })

      const result = await response.json()
      console.log("Test user creation result:", result)

      if (response.ok) {
        setDebugInfo(`Test user created: ${testUser.email}`)
        // Refresh users list after a short delay
        setTimeout(() => {
          fetchUsers()
        }, 1000)
      } else {
        setDebugInfo(`Failed to create test user: ${result.message || result.error}`)
      }
    } catch (err) {
      console.error("Error creating test user:", err)
      setDebugInfo(`Error creating test user: ${err}`)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage platform users and their roles</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={createTestUser} variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Create Test User
          </Button>
        </div>
      </div>

      {debugInfo && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Debug Info:</strong> {debugInfo}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
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

      <div className="flex gap-2 mb-4">
        <Button onClick={checkUsers} variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          Check Users
        </Button>
        <Button onClick={checkDbStatus} variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          DB Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all platform users</CardDescription>
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
              <Button onClick={createTestUser}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Test User
              </Button>
            </div>
          ) : (
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
