"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, BookOpen, Users, MessageSquare, DollarSign } from "lucide-react"
import Link from "next/link"
import { USER_LOGIN_ROUTE } from "@/lib/auth-route-config"

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
          window.location.href = USER_LOGIN_ROUTE
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

  const isTeacher = userData?.role === "teacher"
  const activeStudents = new Set(upcomingLessons.map((lesson) => lesson.studentName).filter(Boolean)).size

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/dashboard/schedule">
              <Calendar className="mr-2 h-4 w-4" />
              {isTeacher ? "Set Availability" : "Schedule Lesson"}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{isTeacher ? "Teaching Snapshot" : "Learning Progress"}</CardTitle>
            <CardDescription>
              {isTeacher ? "Quick view of your current teaching activity" : "Your language learning journey"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTeacher ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Upcoming Lessons</span>
                  <span className="text-sm font-medium">{upcomingLessons.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Students</span>
                  <span className="text-sm font-medium">{activeStudents}</span>
                </div>
                <Button variant="link" asChild className="px-0">
                  <Link href="/dashboard/earnings">View earnings insights</Link>
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
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
            <CardDescription>
              {isTeacher ? "Materials you post for students" : "Helpful materials from your teachers"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-6">
                <BookOpen className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {isTeacher ? "No resources posted yet" : "No resources available yet"}
                </p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/resources">
                    {isTeacher ? "Post resources" : "Browse resources"}
                  </Link>
                </Button>
                {!isTeacher ? <p className="text-xs text-muted-foreground mt-1">Helpful resources will be posted soon.</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>
              {isTeacher ? "Your conversations with students" : "Your conversations with teachers"}
            </CardDescription>
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
            <CardTitle>{isTeacher ? "Teaching Tools" : "Recommended Teachers"}</CardTitle>
            <CardDescription>
              {isTeacher ? "Shortcuts to manage your classes" : "Based on your learning preferences"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              {isTeacher ? (
                <>
                  <DollarSign className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Track payouts and manage your schedule</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <Button variant="link" asChild>
                      <Link href="/dashboard/earnings">View earnings</Link>
                    </Button>
                    <Button variant="link" asChild>
                      <Link href="/dashboard/schedule">Open schedule</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Users className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No recommendations yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/dashboard/find-teachers">Find teachers</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
