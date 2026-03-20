"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Users, BookOpen, CreditCard, Calendar, MessageSquare, AlertTriangle, Globe, TrendingUp } from "lucide-react"
import { userService, teacherService, lessonService, supportService } from "@/lib/api-service"
import { adminFetch } from "@/lib/admin-fetch"

// Define types for the stats
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

interface LanguageStats {
  language: string
  teachers: number
  students: number
  lessons: number
}

interface UserCountByRole {
  students: number
  teachers: number
  admins: number
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [languageFilter, setLanguageFilter] = useState("all")
  const [userCountFilter, setUserCountFilter] = useState("all")
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
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([])
  const [userCountByRole, setUserCountByRole] = useState<UserCountByRole>({
    students: 0,
    teachers: 0,
    admins: 0,
  })
  const [filteredLanguageStats, setFilteredLanguageStats] = useState<LanguageStats[]>([])

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only fetch data on the client
    if (isClient) {
      fetchDashboardData()
    }
  }, [isClient])

  useEffect(() => {
    // Filter language stats based on user count
    if (languageStats.length === 0) return

    let filtered = languageStats

    if (userCountFilter !== "all") {
      const threshold = parseInt(userCountFilter)
      filtered = filtered.filter(lang => lang.teachers >= threshold)
    }

    if (languageFilter !== "all") {
      filtered = filtered.filter(lang => lang.language.toLowerCase() === languageFilter.toLowerCase())
    }

    setFilteredLanguageStats(filtered.sort((a, b) => b.teachers - a.teachers))
  }, [languageFilter, userCountFilter, languageStats])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch dashboard statistics from API
      const [userStats, teacherStats, lessonStats, financeStats, supportStats, langResponse, userRoleResponse] = await Promise.all([
        userService.getUserStats(),
        teacherService.getTeacherStats(),
        lessonService.getLessonStats(),
        userService.getFinanceStats(),
        supportService.getSupportStats(),
        adminFetch("/api/admin/languages/stats"),
        adminFetch("/api/admin/users?role=all&pageSize=1000"),
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

      // Process language stats
      try {
        const langData = await langResponse.json()
        const teachersByLanguage = langData.teachersByLanguage || {}
        const studentsByLanguage = langData.studentsByLanguage || {}
        const lessonsByLanguage = langData.lessonsByLanguage || {}

        const langStats = Object.entries(teachersByLanguage)
          .map(([lang, teachers]) => ({
            language: lang.charAt(0).toUpperCase() + lang.slice(1),
            teachers: Number(teachers) || 0,
            students: Number(studentsByLanguage[lang] || 0),
            lessons: Number(lessonsByLanguage[lang] || 0),
          }))
          .sort((a, b) => b.teachers - a.teachers)

        setLanguageStats(langStats)
      } catch (error) {
        console.error("Error loading language stats:", error)
      }

      // Process user count by role
      try {
        const userData = await userRoleResponse.json()
        const users = userData.users || userData.data || []
        const students = users.filter((u: any) => u.role === "student").length
        const teachers = users.filter((u: any) => u.role === "teacher").length
        const admins = users.filter((u: any) => u.role === "admin").length

        setUserCountByRole({
          students,
          teachers,
          admins,
        })
      } catch (error) {
        console.error("Error loading user count by role:", error)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor platform health, growth, and operations.</p>
        </div>
        <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
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

          {/* User Count by Role */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="h-4 w-24 bg-gray-200 animate-pulse rounded"></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-10 w-20 bg-gray-200 animate-pulse rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Students</CardTitle>
                  <CardDescription>Active student accounts</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="text-3xl font-bold">{userCountByRole.students}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Teachers</CardTitle>
                  <CardDescription>Active teacher accounts</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <BookOpen className="h-8 w-8 text-green-600" />
                  <div className="text-3xl font-bold">{userCountByRole.teachers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Administrators</CardTitle>
                  <CardDescription>Admin accounts</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="text-3xl font-bold">{userCountByRole.admins}</div>
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

        <TabsContent value="languages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>Distribution of users across different roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-center p-6 border rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{userCountByRole.students}</div>
                    <p className="text-sm text-muted-foreground mt-2">Students</p>
                  </div>
                </div>
                <div className="flex items-center justify-center p-6 border rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{userCountByRole.teachers}</div>
                    <p className="text-sm text-muted-foreground mt-2">Teachers</p>
                  </div>
                </div>
                <div className="flex items-center justify-center p-6 border rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">{userCountByRole.admins}</div>
                    <p className="text-sm text-muted-foreground mt-2">Admins</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language Distribution</CardTitle>
              <CardDescription>Teachers and lessons by language with filtering options</CardDescription>
              <div className="flex flex-col gap-4 md:flex-row md:items-end mt-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Filter by Language</label>
                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {languageStats.map(lang => (
                        <SelectItem key={lang.language} value={lang.language.toLowerCase()}>
                          {lang.language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Filter by Teacher Count</label>
                  <Select value={userCountFilter} onValueChange={setUserCountFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="1">1+ Teachers</SelectItem>
                      <SelectItem value="5">5+ Teachers</SelectItem>
                      <SelectItem value="10">10+ Teachers</SelectItem>
                      <SelectItem value="20">20+ Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Language</th>
                      <th className="text-right py-2 px-4 font-medium">Teachers</th>
                      <th className="text-right py-2 px-4 font-medium">Students</th>
                      <th className="text-right py-2 px-4 font-medium">Lessons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLanguageStats.length > 0 ? (
                      filteredLanguageStats.map(lang => (
                        <tr key={lang.language} className="border-b">
                          <td className="py-2 px-4">{lang.language}</td>
                          <td className="text-right py-2 px-4">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                              {lang.teachers}
                            </span>
                          </td>
                          <td className="text-right py-2 px-4">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                              {lang.students}
                            </span>
                          </td>
                          <td className="text-right py-2 px-4">
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                              {lang.lessons}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted-foreground">
                          No languages match the selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
