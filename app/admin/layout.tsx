"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { ADMIN_LOGIN_ROUTE } from "@/lib/auth-route-config"

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === ADMIN_LOGIN_ROUTE) {
      setIsLoading(false)
      setIsAuthenticated(true)
      return
    }

    const checkAdminAuth = () => {
      try {
        // Try both storage keys for backward compatibility
        const userString = localStorage.getItem("linguaConnectUser") || localStorage.getItem("adminSession")

        if (!userString) {
          router.replace(ADMIN_LOGIN_ROUTE)
          return
        }

        const userData = JSON.parse(userString)

        if (!userData || !userData.isLoggedIn) {
          router.replace(ADMIN_LOGIN_ROUTE)
          return
        }

        if (userData.role !== "admin") {
          router.replace(ADMIN_LOGIN_ROUTE)
          return
        }

        // Store the token in sessionStorage for API requests
        if (userData.token) {
          sessionStorage.setItem("auth_token", userData.token)
        }

        setIsAuthenticated(true)
        setIsLoading(false)
      } catch (error) {
        console.error("Error checking admin auth:", error)
        router.replace(ADMIN_LOGIN_ROUTE)
      }
    }

    checkAdminAuth()
  }, [router, pathname])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5A2B]"></div>
      </div>
    )
  }

  // For login page, render children directly without AdminLayout wrapper
  if (pathname === ADMIN_LOGIN_ROUTE) {
    return <>{children}</>
  }

  // For other admin pages, wrap in AdminLayout
  if (isAuthenticated) {
    return <AdminLayout>{children}</AdminLayout>
  }

  return null
}
