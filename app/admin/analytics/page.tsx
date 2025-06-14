"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { analyticsService } from "@/lib/api-service"
import { Skeleton } from "@/components/ui/skeleton"

interface AnalyticsData {
  users: {
    total: number
    growth: number
    active: number
  }
  teachers: {
    total: number
    growth: number
    active: number
  }
  lessons: {
    total: number
    growth: number
    completed: number
  }
  revenue: {
    total: number
    growth: number
    formatted: string
  }
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const dashboardStats = await analyticsService.getDashboardStats()
        setData(dashboardStats)
      } catch (error) {
        console.error("Failed to fetch analytics data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{data?.users.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {(data?.users.growth ?? 0) >= 0 ? "+" : ""}
                      {data?.users.growth ?? 0}% from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{data?.teachers.active.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {(data?.teachers.growth ?? 0) >= 0 ? "+" : ""}
                      {data?.teachers.growth ?? 0}% from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{data?.lessons.completed.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {(data?.lessons.growth ?? 0) >= 0 ? "+" : ""}
                      {data?.lessons.growth ?? 0}% from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{data?.revenue.formatted}</div>
                    <p className="text-xs text-muted-foreground">
                      {(data?.revenue.growth ?? 0) >= 0 ? "+" : ""}
                      {data?.revenue.growth ?? 0}% from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {loading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Loading user growth data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {loading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Loading revenue data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>Detailed analytics about user acquisition, retention, and engagement.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              {loading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Loading user analytics data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lessons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Analytics</CardTitle>
              <CardDescription>Detailed analytics about lesson bookings, completions, and ratings.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              {loading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Loading lesson analytics data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed analytics about revenue, transactions, and financial metrics.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              {loading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Loading revenue analytics data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
