"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentReviewsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isStudent, setIsStudent] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if user is a student using localStorage
    const checkUserRole = () => {
      try {
        // Get user from localStorage
        const userString = localStorage.getItem("linguaConnectUser")

        if (!userString) {
          // No user found, redirect to login
          router.push("/login")
          return
        }

        // Parse user data
        const user = JSON.parse(userString)

        // Check if user is a student
        if (user && user.role === "student") {
          setIsStudent(true)
        } else {
          // Redirect teachers to their reviews page
          router.push("/dashboard/teacher-reviews")
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        setError("There was an error checking your account. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [router])

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>We encountered a problem</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-[#8B5A2B] text-white rounded-md"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isStudent) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Your Reviews</h1>
      <p className="text-gray-600 mb-8">Reviews you've left for your teachers.</p>

      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            You haven't left any reviews yet. After completing lessons, you can rate your teachers here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-gray-500">Complete lessons to leave reviews for your teachers!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="container py-10">
      <Skeleton className="h-10 w-1/3 mb-6" />
      <Skeleton className="h-4 w-2/3 mb-8" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="py-10">
            <Skeleton className="h-4 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
