"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BookOpen, CreditCard, Calendar, MessageSquare, AlertTriangle } from "lucide-react"
import { userService, teacherService, lessonService, supportService } from "@/lib/api-service"

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
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
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch dashboard statistics from API
      const [userStats, teacherStats, lessonStats, financeStats, supportStats] = await Promise.all([
        userService.getUserStats(),
        teacherService.getTeacherStats(),
        lessonService.getLessonStats(),
        userService.getFinanceStats(),
        supportService.getSupportStats(),
      ])

      setStats({
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
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</div>
      </div>

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

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="h-5 w-32 bg-gray-200 animate-pulse rounded"></CardTitle>
                    <CardDescription className="h-3 w-48 bg-gray-200 animate-pulse rounded mt-2"></CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="h-16 w-16 bg-gray-200 animate-pulse rounded-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                  <CardDescription>Users active in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8 text-[#8B5A2B]" />
                    <div className="text-4xl font-bold">{stats.activeUsers.toLocaleString()}</div>
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
                    <div className="text-4xl font-bold">{stats.pendingTeachers.toLocaleString()}</div>
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
                    <div className="text-4xl font-bold">{stats.openTickets.toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New user registrations over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">User data will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Applications</CardTitle>
              <CardDescription>New teacher applications over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Teacher application data will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Platform revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Revenue data will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
