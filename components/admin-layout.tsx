"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
// authService import is not directly needed here as logout is passed as a prop
// and user data is passed as a prop. Removed it to simplify dependencies.

// Define the props interface for the AdminLayout component
interface AdminLayoutProps {
  children: React.ReactNode;
  currentUserEmail: string; // To display the current admin's email
  onLogout: () => Promise<void>; // The logout function passed from the parent layout (MUST be a Promise<void>)
}

export function AdminLayout({ children, currentUserEmail, onLogout }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // The handleLogout function here will simply call the prop
  const handleLocalLogout = async () => {
    try {
      await onLogout(); // Call the logout function passed from parent
    } catch (error) {
      console.error("Local logout error (prop call failed):", error);
      toast({
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
      // Fallback: If parent's logout somehow fails, force client-side redirect
      router.push("/admin/login");
    }
  };


  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/admin/dashboard", // Changed to /admin/dashboard for consistency
      active: pathname === "/admin/dashboard",
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
      {/* Sidebar - Changed background to a custom brown color */}
      <div
        className={cn(
          "bg-[#6C4F3D] text-white border-r flex flex-col transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-64",
        )}
      >
        <div className="p-3 flex justify-between items-center border-b border-gray-700">
          {/* Logo area - Now an image that links to home page */}
          <Button
            variant="ghost"
            className={cn("font-bold text-xl p-0 h-auto text-white hover:bg-transparent", isCollapsed && "hidden")}
            onClick={() => router.push("/")} // Directs to home page
          >
            <img
              src="https://placehold.co/120x40/6C4F3D/FFFFFF?text=TOKI+CONNECT" // REPLACE WITH YOUR ACTUAL LOGO URL
              alt="TOKI CONNECT Logo"
              className="h-auto max-h-8" // Adjust size as needed
            />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="ml-auto text-white hover:bg-[#8B5A2B]/20">
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
                    route.active ? "bg-[#8B5A2B] text-white hover:bg-[#8B5A2B]/90" : "hover:bg-[#8B5A2B]/10 text-white", // Link colors adjusted
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
        <div className="p-3 mt-auto border-t border-gray-700">
          <div className={cn("flex items-center gap-x-2", isCollapsed && "justify-center")}>
            <div className="h-8 w-8 rounded-full bg-[#8B5A2B]/10 flex items-center justify-center">
              <span className="font-semibold text-sm text-white">{currentUserEmail?.charAt(0)?.toUpperCase() || "A"}</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <p className="text-sm font-medium text-white">{currentUserEmail || "Admin User"}</p>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-gray-300 hover:text-white"
                  onClick={handleLocalLogout} // Use the local handler
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  )
}
