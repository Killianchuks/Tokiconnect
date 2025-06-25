"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminLayout as BaseAdminLayout } from "@/components/admin-layout"
import { authService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"
import {
  Home, LineChart, Package, Package2, Settings, ShoppingCart, Users2,
  DollarSign, BookOpen, MessageSquare, FileText, Globe, Bell, Menu,
  Search, CircleUser
} from "lucide-react"

interface AuthUser {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const checkAdminAuth = async () => {
      setIsLoading(true)
      try {
        console.log("[AdminLayout] checkAdminAuth: Attempting to fetch current user.")
        const user = await authService.getCurrentUser()

        if (!user || user.role !== "admin") {
          console.log(`[AdminLayout] checkAdminAuth: User is not admin (role: ${user?.role || 'none'}).`)
          setCurrentUser(null)

          if (pathname !== "/admin/login") {
            console.log("[AdminLayout] checkAdminAuth: Redirecting to /admin/login.")
            router.replace("/admin/login")
          } else {
            setIsLoading(false)
          }
          return
        }

        console.log("[AdminLayout] checkAdminAuth: Admin authentication successful.")
        setCurrentUser(user as AuthUser)
        setIsLoading(false)

      } catch (error) {
        console.error("[AdminLayout] checkAdminAuth: Error during authentication check:", error)
        setCurrentUser(null)
        toast({
          title: "Authentication Error",
          description: "Failed to verify admin session. Please log in again.",
          variant: "destructive",
        })

        if (pathname !== "/admin/login") {
          router.replace("/admin/login")
        } else {
          setIsLoading(false)
        }
      }
    }

    if (pathname === "/admin/login") {
      console.log("[AdminLayout] On /admin/login. Skipping admin check.");
      return
    }

    checkAdminAuth()
  }, [router, pathname, isClient, toast])

  // 🚨 Handle unexpected unauthorized state gracefully
  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== "admin") && pathname !== "/admin/login") {
      console.warn("[AdminLayout] Unauthorized user. Redirecting to /admin/login.")
      router.replace("/admin/login")
    }
  }, [isLoading, currentUser, pathname, router])

  if (pathname === "/admin/login") {
    console.log("[AdminLayout] Rendering login page without admin layout.")
    return children
  }

  if (!isClient) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (currentUser && currentUser.role === "admin") {
    return (
      <BaseAdminLayout
        currentUserEmail={currentUser.email}
        onLogout={async () => {
          console.log("[AdminLayout] Logout button clicked. Attempting to log out via API.")
          try {
            await authService.logout()
            toast({
              title: "Logged Out",
              description: "You have been successfully logged out.",
            })
            console.log("[AdminLayout] Logout API call successful. Redirecting to /admin/login.")
            router.push("/admin/login")
          } catch (error) {
            console.error("[AdminLayout] Failed to log out via API:", error)
            toast({
              title: "Logout Error",
              description: "Failed to log out. Please try again.",
              variant: "destructive",
            })
          }
        }}
      >
        {children}
      </BaseAdminLayout>
    )
  }

  // Show a fallback while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  )
}
