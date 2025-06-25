"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BookOpen, CreditCard, Calendar, MessageSquare, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  totalUsers: number
  totalTeachers: number
  totalLessons: number
  totalRevenue: number
  activeUsers: number
  pendingTeachers: number
  openTickets: number
  userGrowth: number
  teacherGrowth: number
  lessonGrowth: number
  revenueGrowth: number
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState("Loading dashboard...")
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTeachers: 0,
    totalLessons: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingTeachers: 0,
    openTickets: 0,
    userGrowth: 0,
    teacherGrowth: 0,
    lessonGrowth: 0,
    revenueGrowth: 0,
  })

  useEffect(() => {
    console.log("Admin dashboard component mounted")
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    console.log("fetchDashboardData called - fetching real data from database")
    setIsLoading(true)
    setDebugInfo("Fetching real data from database...")

    try {
      // Fetch all stats in parallel from your existing API endpoints
      const [userStatsRes, teacherStatsRes, lessonStatsRes, financeStatsRes, supportStatsRes] = await Promise.all([
        fetch("/api/admin/stats/users"),
        fetch("/api/admin/stats/teachers"),
        fetch("/api/admin/stats/lessons"),
        fetch("/api/admin/stats/finances"),
        fetch("/api/admin/stats/support"),
      ])

      console.log("API responses received:", {
        users: userStatsRes.status,
        teachers: teacherStatsRes.status,
        lessons: lessonStatsRes.status,
        finances: financeStatsRes.status,
        support: supportStatsRes.status,
      })

      // Parse responses
      const userStats = userStatsRes.ok ? await userStatsRes.json() : null
      const teacherStats = teacherStatsRes.ok ? await teacherStatsRes.json() : null
      const lessonStats = lessonStatsRes.ok ? await lessonStatsRes.json() : null
      const financeStats = financeStatsRes.ok ? await financeStatsRes.json() : null
      const supportStats = supportStatsRes.ok ? await supportStatsRes.json() : null

      console.log("Parsed stats:", {
        userStats,
        teacherStats,
        lessonStats,
        financeStats,
        supportStats,
      })

      // Combine all stats
      const combinedStats: DashboardStats = {
        totalUsers: userStats?.totalUsers || 0,
        activeUsers: userStats?.activeUsers || 0,
        userGrowth: userStats?.growthRate || 0,

        totalTeachers: teacherStats?.totalTeachers || 0,
        pendingTeachers: teacherStats?.pendingTeachers || 0,
        teacherGrowth: teacherStats?.growthRate || 0,

        totalLessons: lessonStats?.totalLessons || 0,
        lessonGrowth: lessonStats?.growthRate || 0,

        totalRevenue: financeStats?.totalRevenue || 0,
        revenueGrowth: financeStats?.growthRate || 0,

        openTickets: supportStats?.openTickets || 0,
      }

      console.log("Setting combined stats:", combinedStats)
      setStats(combinedStats)
      setDebugInfo(`Real data loaded successfully at ${new Date().toLocaleTimeString()}`)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setDebugInfo(`Error fetching real data: ${error instanceof Error ? error.message : "Unknown error"}`)

      // Fallback to show some basic info even if APIs fail
      setStats({
        totalUsers: 0,
        totalTeachers: 0,
        totalLessons: 0,
        totalRevenue: 0,
        activeUsers: 0,
        pendingTeachers: 0,
        openTickets: 0,
        userGrowth: 0,
        teacherGrowth: 0,
        lessonGrowth: 0,
        revenueGrowth: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      setDebugInfo("Testing database connection...")
      const response = await fetch("/api/debug/db-status")
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(`Database Status: ${JSON.stringify(data)}`)
      } else {
        setDebugInfo(`Database Test Failed: ${response.status}`)
      }
    } catch (error) {
      setDebugInfo(`Database Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const testUserCount = async () => {
    try {
      setDebugInfo("Testing user count API...")
      const response = await fetch("/api/admin/stats/users")
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(`User Stats: ${JSON.stringify(data)}`)
      } else {
        setDebugInfo(`User Stats Failed: ${response.status}`)
      }
    } catch (error) {
      setDebugInfo(`User Stats Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</div>
      </div>

      {/* Debug Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-800">Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs font-mono text-blue-700">{debugInfo}</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={fetchDashboardData} disabled={isLoading}>
              {isLoading ? "Loading..." : "Refresh Real Data"}
            </Button>
            <Button size="sm" variant="outline" onClick={testDatabaseConnection}>
              Test Database
            </Button>
            <Button size="sm" variant="outline" onClick={testUserCount}>
              Test User API
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.userGrowth > 0 ? "+" : ""}
                    {stats.userGrowth}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTeachers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.teacherGrowth > 0 ? "+" : ""}
                    {stats.teacherGrowth}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLessons.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.lessonGrowth > 0 ? "+" : ""}
                    {stats.lessonGrowth}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.revenueGrowth > 0 ? "+" : ""}
                    {stats.revenueGrowth}% from last month
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Users active in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-[#8B5A2B]" />
                  <div className="text-4xl font-bold">
                    {isLoading ? (
                      <div className="h-10 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.activeUsers.toLocaleString()
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Teachers</CardTitle>
                <CardDescription>Teachers awaiting approval</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                  <div className="text-4xl font-bold">
                    {isLoading ? (
                      <div className="h-10 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.pendingTeachers.toLocaleString()
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open Support Tickets</CardTitle>
                <CardDescription>Tickets requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="flex items-center gap-4">
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                  <div className="text-4xl font-bold">
                    {isLoading ? (
                      <div className="h-10 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.openTickets.toLocaleString()
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage platform users - Total: {stats.totalUsers}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">User management features will be displayed here</p>
                  <p className="text-sm text-muted-foreground mb-4">Current users in database: {stats.totalUsers}</p>
                  <Button variant="outline" onClick={() => (window.location.href = "/admin/users")}>
                    Go to User Management
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Management</CardTitle>
              <CardDescription>Manage teacher applications - Total: {stats.totalTeachers}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Teacher management features will be displayed here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Current teachers: {stats.totalTeachers} | Pending: {stats.pendingTeachers}
                  </p>
                  <Button variant="outline" onClick={() => (window.location.href = "/admin/teachers")}>
                    Go to Teacher Management
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Platform revenue - Total: ${stats.totalRevenue.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Financial data will be displayed here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Total Revenue: ${stats.totalRevenue.toLocaleString()}
                  </p>
                  <Button variant="outline" onClick={() => (window.location.href = "/admin/finances")}>
                    Go to Financial Management
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
