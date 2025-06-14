"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { LogOut, Home, Globe, Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { SupportModal } from "@/components/support-modal"

interface User {
  isLoggedIn: boolean
  role?: string
  email?: string
  name?: string
  id?: string | number
}

interface SiteHeaderProps {
  showAuthButtons?: boolean
}

export function SiteHeader({ showAuthButtons = true }: SiteHeaderProps) {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)
  const [supportModalOpen, setSupportModalOpen] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("linguaConnectUser")
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setIsLoggedIn(!!user.isLoggedIn)
          setUserData(user)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("linguaConnectUser")
      setIsLoggedIn(false)
      setUserData(null)
      router.push("/")
    }
  }

  // Function to handle smooth scrolling to sections
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Scroll to the element with a slight offset to account for the sticky header
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  const isStudent = userData?.role === "student"

  return (
    <header className="border-b sticky top-0 z-50 bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href={isLoggedIn ? "/dashboard" : "/"}>
            <Image src="/logo.png" alt="TOKI CONNECT Logo" width={40} height={40} />
          </Link>
          <span className="sr-only">TOKI CONNECT</span>
        </div>
        <nav className="hidden md:flex gap-6">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="text-sm font-medium hover:underline underline-offset-4 flex items-center"
          >
            <Home className="mr-1 h-4 w-4" />
            Home
          </Link>
          {isLoggedIn ? (
            // Logged in navigation
            <>
              {userData && userData.role !== "student" && (
                <Link href="/dashboard/schedule" className="text-sm font-medium hover:underline underline-offset-4">
                  Schedule
                </Link>
              )}
              <Link href="/dashboard/messages" className="text-sm font-medium hover:underline underline-offset-4">
                Messages
              </Link>
              {userData && userData.role === "teacher" ? (
                <Link href="/dashboard/earnings" className="text-sm font-medium hover:underline underline-offset-4">
                  Earnings
                </Link>
              ) : (
                <Link
                  href="/dashboard/find-teachers"
                  className="text-sm font-medium hover:underline underline-offset-4 flex items-center"
                >
                  <Search className="mr-1 h-4 w-4" />
                  Find Teachers
                </Link>
              )}
            </>
          ) : (
            // Public navigation
            <>
              <button
                onClick={() => scrollToSection("features")}
                className="text-sm font-medium hover:underline underline-offset-4 bg-transparent border-none cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-sm font-medium hover:underline underline-offset-4 bg-transparent border-none cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-sm font-medium hover:underline underline-offset-4 bg-transparent border-none cursor-pointer"
              >
                Testimonials
              </button>
            </>
          )}
          <Link href="/languages" className="text-sm font-medium hover:underline underline-offset-4 flex items-center">
            <Globe className="mr-1 h-4 w-4" />
            Languages
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isLoggedIn ? (
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          ) : (
            showAuthButtons && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Log in
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push("/login?role=student")}>
                      Login as Student
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/login?role=teacher")}>
                      Login as Teacher
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link href="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )
          )}
        </div>
      </div>

      {/* Support Modal */}
      <SupportModal
        open={supportModalOpen}
        onOpenChange={setSupportModalOpen}
        userEmail={userData?.email || ""}
        supportEmail="support@tokiconnect.com"
      />
    </header>
  )
}
