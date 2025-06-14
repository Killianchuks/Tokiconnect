"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [user, setUser] = useState<{
    isLoggedIn: boolean
    role: string
    token?: string
  } | null>(null)

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Skip auth check if not on client yet
    if (!isClient) return

    const checkAdminAuth = () => {
      try {
        // Try both storage keys for backward compatibility
        const userString = localStorage.getItem("linguaConnectUser") || localStorage.getItem("adminSession")

        if (!userString) {
          console.log("No user found, redirecting to admin login")
          router.push("/admin/login")
          return
        }

        const userData = JSON.parse(userString)
        setUser(userData)

        if (!userData || !userData.isLoggedIn) {
          console.log("User not logged in, redirecting to admin login")
          router.push("/admin/login")
          return
        }

        if (userData.role !== "admin") {
          console.log("User is not an admin, redirecting to admin login")
          router.push("/admin/login")
          return
        }

        // Store the token in sessionStorage for API requests
        if (userData.token) {
          sessionStorage.setItem("auth_token", userData.token)
        }

        console.log("Admin authentication successful")
        setIsLoading(false)
      } catch (error) {
        console.error("Error checking admin auth:", error)
        router.push("/admin/login")
      }
    }

    checkAdminAuth()
  }, [router, isClient]) // Add isClient as dependency

  // Only render content when we're on the client
  if (!isClient) {
    return null // Return null during SSR to avoid hydration mismatch
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <AdminLayout>{children}</AdminLayout>
}
