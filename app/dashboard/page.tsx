"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, BookOpen, Users, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  // State for user data
  const [userData, setUserData] = useState<any>(null)
  // State for loading
  const [isLoading, setIsLoading] = useState(true)
  // State for stats that would cause hydration errors if rendered directly
  const [stats, setStats] = useState({
    hoursCompleted: 0,
    languages: 0,
    languagesList: [] as string[],
  })
  // State for upcoming lessons
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([])

  // Fetch user data on client-side only
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user from localStorage
        const storedUser = localStorage.getItem("linguaConnectUser")
        if (!storedUser) {
          window.location.href = "/login"
          return
        }

        const userData = JSON.parse(storedUser)
        setUserData(userData)

        // Fetch upcoming lessons from API
        try {
          const lessonsResponse = await fetch(
            `/api/lessons?userId=${userData.id}&role=${userData.role}&status=upcoming`
          )
          if (lessonsResponse.ok) {
            const lessonsData = await lessonsResponse.json()
            // Transform and get only first 3 lessons
            const transformedLessons = lessonsData.slice(0, 3).map((lesson: any) => ({
              id: lesson.id,
              teacherName: lesson.teacher_first_name 
                ? `${lesson.teacher_first_name} ${lesson.teacher_last_name || ''}`.trim()
                : 'Teacher',
              studentName: lesson.student_first_name
                ? `${lesson.student_first_name} ${lesson.student_last_name || ''}`.trim()
                : 'Student',
              date: new Date(lesson.start_time).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
              time: new Date(lesson.start_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
              type: lesson.type || 'Lesson',
            }))
            setUpcomingLessons(transformedLessons)
          }
        } catch (error) {
          console.error("Error fetching lessons:", error)
        }

        // Set stats
        setStats({
          hoursCompleted: 0,
          languages: 0,
          languagesList: [],
        })
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Show loading state during initial render
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Skeleton loaders */}
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/dashboard/schedule">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Lesson
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>Your language learning journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Hours Completed</span>
                <span className="text-sm font-medium">{stats.hoursCompleted}</span>
              </div>
              <Progress value={stats.hoursCompleted > 0 ? (stats.hoursCompleted / 30) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Languages</span>
                <span className="text-sm font-medium">{stats.languages}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.languagesList.length > 0 ? (
                  stats.languagesList.map((language) => (
                    <span key={language} className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">
                      {language}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No languages added yet</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Lessons</CardTitle>
            <CardDescription>Your scheduled sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingLessons.length > 0 ? (
                <>
                  {upcomingLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {userData?.role === 'teacher' ? lesson.studentName : lesson.teacherName}
                        </p>
                        <p className="text-xs text-muted-foreground">{lesson.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{lesson.date}</p>
                        <p className="text-xs text-muted-foreground">{lesson.time}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="link" asChild className="w-full">
                    <Link href="/dashboard/schedule">View all lessons</Link>
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <Clock className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No upcoming lessons</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/dashboard/schedule">Schedule a lesson</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Learning Resources</CardTitle>
            <CardDescription>Helpful materials for your studies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-6">
                <BookOpen className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No resources available yet</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/resources">Browse resources</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Your conversations with teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No recent messages</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/dashboard/messages">View all messages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recommended Teachers</CardTitle>
            <CardDescription>Based on your learning preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Users className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No recommendations yet</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/dashboard/find-teachers">Find teachers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
