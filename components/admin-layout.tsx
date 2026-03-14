"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Users,
  CreditCard,
  Settings,
  LifeBuoy,
  AlertTriangle,
  Globe,
  BookOpen,
  MessageSquare,
  Home,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/api-service"

interface AdminLayoutProps {
  children: React.ReactNode
  onLogout?: () => void
}

export function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [adminUser, setAdminUser] = useState<any>(null)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return
    }

    // Check if admin is logged in
    const adminSession = localStorage.getItem("adminSession")
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession)
        if (session.user) {
          setAdminUser(session.user)
        }
      } catch (error) {
        console.error("Error parsing admin session:", error)
      }
    } else {
      // Try to get from linguaConnectUser if adminSession doesn't exist
      const userString = localStorage.getItem("linguaConnectUser")
      if (userString) {
        try {
          const user = JSON.parse(userString)
          if (user && user.role === "admin") {
            setAdminUser(user)
          }
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      await authService.logout()
      localStorage.removeItem("adminSession")
      localStorage.removeItem("linguaConnectUser")

      if (onLogout) {
        onLogout()
      } else {
        toast({
          title: "Logged out",
          description: "You have been logged out successfully",
        })
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Even if the API call fails, we still want to clear local storage
      localStorage.removeItem("adminSession")
      localStorage.removeItem("linguaConnectUser")
      router.push("/admin/login")
    }
  }

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/admin",
      active: pathname === "/admin",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/admin/analytics",
      active: pathname === "/admin/analytics",
    },
    {
      label: "Users",
      icon: Users,
      href: "/admin/users",
      active: pathname === "/admin/users",
    },
    {
      label: "Teachers",
      icon: BookOpen,
      href: "/admin/teachers",
      active: pathname === "/admin/teachers",
    },
    {
      label: "Finances",
      icon: CreditCard,
      href: "/admin/finances",
      active: pathname === "/admin/finances",
    },
    {
      label: "Languages",
      icon: Globe,
      href: "/admin/languages",
      active: pathname === "/admin/languages",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/admin/messages",
      active: pathname === "/admin/messages",
    },
    {
      label: "Reports",
      icon: AlertTriangle,
      href: "/admin/reports",
      active: pathname === "/admin/reports",
    },
    {
      label: "Support",
      icon: LifeBuoy,
      href: "/admin/support",
      active: pathname === "/admin/support",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/admin/settings",
      active: pathname === "/admin/settings",
    },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={cn(
          "bg-secondary/10 border-r flex flex-col transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-64",
        )}
      >
        <div className="p-3 flex justify-between items-center border-b">
          <Button
            variant="ghost"
            className={cn("font-bold text-xl p-0 h-auto", isCollapsed && "hidden")}
            onClick={() => router.push("/admin")}
          >
            TOKI ADMIN
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="ml-auto">
            {isCollapsed ? "→" : "←"}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {routes.map((route) => (
                <Button
                  key={route.href}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-x-2 text-sm font-medium px-3 py-2 h-auto",
                    route.active ? "bg-[#8B5A2B] text-white hover:bg-[#8B5A2B]/90" : "hover:bg-[#8B5A2B]/10",
                  )}
                  onClick={() => router.push(route.href)}
                >
                  <route.icon className="h-5 w-5" />
                  {!isCollapsed && <span>{route.label}</span>}
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
        <div className="p-3 mt-auto border-t">
          <div className={cn("flex items-center gap-x-2", isCollapsed && "justify-center")}>
            <div className="h-8 w-8 rounded-full bg-[#8B5A2B]/10 flex items-center justify-center">
              <span className="font-semibold text-sm">{adminUser?.name?.charAt(0) || "A"}</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <p className="text-sm font-medium">{adminUser?.name || "Admin User"}</p>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  )
}
