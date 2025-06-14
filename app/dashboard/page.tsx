"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, BookOpen, Star } from "lucide-react"
import Link from "next/link"

interface UserData {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
  name?: string
}

interface UserStats {
  lessonsCompleted: number
  lessonsUpcoming: number
  favoriteTeachers: number
  averageRating: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [stats, setStats] = useState<UserStats>({
    lessonsCompleted: 0,
    lessonsUpcoming: 0,
    favoriteTeachers: 0,
    averageRating: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user from localStorage
    try {
      const storedUser = localStorage.getItem("linguaConnectUser")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)

        // Fetch user stats
        fetchUserStats(userData.id)
      } else {
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }, [])

  const fetchUserStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const userName = user?.first_name || user?.name || "User"
  const isTeacher = user?.role === "teacher"

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {userName}!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isTeacher
            ? "Manage your teaching schedule and connect with students."
            : "Track your language learning progress and connect with teachers."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Lessons</p>
                <h3 className="text-2xl font-bold">{stats.lessonsCompleted}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full dark:bg-green-900">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Lessons</p>
                <h3 className="text-2xl font-bold">{stats.lessonsUpcoming}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full dark:bg-blue-900">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {isTeacher ? "Active Students" : "Favorite Teachers"}
                </p>
                <h3 className="text-2xl font-bold">{stats.favoriteTeachers}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full dark:bg-purple-900">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Rating</p>
                <h3 className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full dark:bg-amber-900">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Lessons</CardTitle>
            <CardDescription>Your scheduled lessons for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lessonsUpcoming > 0 ? (
              <div className="space-y-4">
                {/* This would be a map over actual lessons */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Spanish Conversation Practice</h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Tomorrow</span>
                      <Clock className="h-4 w-4 ml-3 mr-1" />
                      <span>10:00 AM</span>
                    </div>
                  </div>
                  <Button size="sm">Join</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You don't have any upcoming lessons</p>
                {!isTeacher && (
                  <Button asChild>
                    <Link href="/dashboard/find-teachers">Find Teachers</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isTeacher ? "Teaching Stats" : "Learning Progress"}</CardTitle>
            <CardDescription>
              {isTeacher ? "Your teaching activity overview" : "Your language learning journey"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Hours Completed</span>
                <span className="font-bold">0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-[#8B5A2B] h-2.5 rounded-full" style={{ width: "0%" }}></div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-medium">Languages</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex gap-2">
                <p className="text-sm text-gray-500">No languages added yet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
