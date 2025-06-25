"use client"

// CORRECTED IMPORT: Import React and its hooks directly
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Ensure BarChart, ChartContainer, ChartTooltip, ChartTooltipContent are correctly imported
// from your Shadcn UI setup if they exist in your project.
// If you are using recharts directly, you might need to adjust these imports.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"; // Assuming you are using recharts
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"; // If you have Shadcn's chart components
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, Users2, BookOpen, ShoppingCart, DollarSign } from "lucide-react" // Ensure all used icons are imported

// Assuming your api-service provides the necessary functions
import { analyticsService, userService, teacherService, lessonService, financeService } from "@/lib/api-service"

// Data interfaces for analytics stats
interface UserStats {
  total: number;
  growth: number;
  active: number;
}

interface TeacherStats {
  total: number;
  growth: number;
  active: number; // Assuming this means active teachers
}

interface LessonStats {
  total: number;
  growth: number;
  completed: number;
}

interface RevenueStats {
  total: number;
  growth: number;
  formatted: string;
}

interface LanguageStats {
  mostPopular: string;
  fastestGrowing: string;
}

interface DashboardStats {
  users: UserStats;
  teachers: TeacherStats;
  lessons: LessonStats;
  revenue: RevenueStats;
  languages: LanguageStats;
}

export default function DashboardPage() {
  const router = useRouter()
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUserPeriod, setSelectedUserPeriod] = useState("last7days")
  const [selectedRevenuePeriod, setSelectedRevenuePeriod] = useState("last7days")
  const [selectedTeacherPeriod, setSelectedTeacherPeriod] = useState("last7days")

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const stats = await analyticsService.getDashboardStats()
        setDashboardStats(stats)
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        setError("Failed to load dashboard statistics. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardStats()
  }, [])

  const fetchUserAnalytics = async (period: string) => {
    try {
      const data = await analyticsService.getUserStats(period)
      // Assuming userStats.users contains data for a chart
      // For now, just update the main stats if this is a top-level stat
      setDashboardStats(prev => prev ? { ...prev, users: { ...prev.users, growth: data.growth || 0 } } : null);
      // You would typically use this data to populate a specific chart
    } catch (err) {
      console.error(`Error fetching user analytics for ${period}:`, err)
    }
  }

  const fetchRevenueAnalytics = async (period: string) => {
    try {
      const data = await analyticsService.getRevenueStats(period)
      setDashboardStats(prev => prev ? { ...prev, revenue: { ...prev.revenue, growth: data.growth || 0 } } : null);
      // You would typically use this data to populate a specific chart
    } catch (err) {
      console.error(`Error fetching revenue analytics for ${period}:`, err)
    }
  }

  const fetchTeacherAnalytics = async (period: string) => {
    try {
      const data = await analyticsService.getTeacherStats(period)
      setDashboardStats(prev => prev ? { ...prev, teachers: { ...prev.teachers, growth: data.growth || 0 } } : null);
      // You would typically use this data to populate a specific chart
    } catch (err) {
      console.error(`Error fetching teacher analytics for ${period}:`, err)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (!dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No dashboard data available.</p>
      </div>
    )
  }

  // Sample chart data structure (recharts)
  // You'll need to fetch actual time-series data from your analyticsService for these charts
  const userChartData = [
    { name: "Mon", users: 10 }, { name: "Tue", users: 15 }, { name: "Wed", users: 20 },
    { name: "Thu", users: 12 }, { name: "Fri", users: 18 }, { name: "Sat", users: 25 }, { name: "Sun", users: 30 }
  ];

  const revenueChartData = [
    { name: "Mon", revenue: 100 }, { name: "Tue", revenue: 150 }, { name: "Wed", revenue: 200 },
    { name: "Thu", revenue: 120 }, { name: "Fri", revenue: 180 }, { name: "Sat", revenue: 250 }, { name: "Sun", revenue: 300 }
  ];

  const teacherChartData = [
    { name: "Mon", teachers: 2 }, { name: "Tue", teachers: 3 }, { name: "Wed", teachers: 5 },
    { name: "Thu", teachers: 4 }, { name: "Fri", teachers: 6 }, { name: "Sat", teachers: 8 }, { name: "Sun", teachers: 10 }
  ];


  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform's key metrics.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.users.growth >= 0 ? `+${dashboardStats.users.growth}% from last month` : `${dashboardStats.users.growth}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.teachers.total}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.teachers.growth >= 0 ? `+${dashboardStats.teachers.growth}% from last month` : `${dashboardStats.teachers.growth}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.lessons.total}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.lessons.growth >= 0 ? `+${dashboardStats.lessons.growth}% from last month` : `${dashboardStats.lessons.growth}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.revenue.formatted}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.revenue.growth >= 0 ? `+${dashboardStats.revenue.growth}% from last month` : `${dashboardStats.revenue.growth}% from last month`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>User Analytics</CardTitle>
            <Select value={selectedUserPeriod} onValueChange={(value) => { setSelectedUserPeriod(value); fetchUserAnalytics(value); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            <ChartContainer
              config={{
                users: {
                  label: "Users",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userChartData} // Replace with actual fetched user data
                  margin={{
                    top: 0, // Adjusted margin to be 0
                    right: 0, // Adjusted margin to be 0
                    left: 0, // Adjusted margin to be 0
                    bottom: 0, // Adjusted margin to be 0
                  }}
                >
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Revenue Analytics</CardTitle>
            <Select value={selectedRevenuePeriod} onValueChange={(value) => { setSelectedRevenuePeriod(value); fetchRevenueAnalytics(value); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueChartData} // Replace with actual fetched revenue data
                  margin={{
                    top: 0, // Adjusted margin to be 0
                    right: 0, // Adjusted margin to be 0
                    left: 0, // Adjusted margin to be 0
                    bottom: 0, // Adjusted margin to be 0
                  }}
                >
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Teacher Analytics</CardTitle>
            <Select value={selectedTeacherPeriod} onValueChange={(value) => { setSelectedTeacherPeriod(value); fetchTeacherAnalytics(value); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            <ChartContainer
              config={{
                teachers: {
                  label: "Teachers",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={teacherChartData} // Replace with actual fetched teacher data
                  margin={{
                    top: 0, // Adjusted margin to be 0
                    right: 0, // Adjusted margin to be 0
                    left: 0, // Adjusted margin to be 0
                    bottom: 0, // Adjusted margin to be 0
                  }}
                >
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="teachers" fill="var(--color-teachers)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Languages and other info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Language Popularity</CardTitle>
            <CardDescription>Most popular and fastest growing languages on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Most Popular Language:</Label>
              <p className="text-lg font-semibold">{dashboardStats.languages.mostPopular}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-medium">Fastest Growing Language:</Label>
              <p className="text-lg font-semibold">{dashboardStats.languages.fastestGrowing}</p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for another card or recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest lessons, registrations, and reviews.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display yet.</p>
            {/* You'd fetch and display actual recent activities here */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
