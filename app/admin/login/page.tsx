"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if already logged in as admin
  useEffect(() => {
    if (!isClient) return

    const checkAdminAuth = () => {
      try {
        const userString = localStorage.getItem("linguaConnectUser")
        if (userString) {
          const user = JSON.parse(userString)
          if (user && user.isLoggedIn && user.role === "admin") {
            console.log("Already logged in as admin, redirecting to admin dashboard")
            router.push("/admin")
          }
        }
      } catch (error) {
        console.error("Error checking admin auth:", error)
      }
    }

    checkAdminAuth()
  }, [router, isClient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("Attempting admin login with:", email)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("Login response:", data)

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      if (data.success && data.user) {
        // Verify the user is an admin
        if (data.user.role !== "admin") {
          throw new Error("You do not have permission to access the admin area")
        }

        console.log("Admin login successful, storing user data")

        // Store admin user in localStorage
        localStorage.setItem(
          "linguaConnectUser",
          JSON.stringify({
            ...data.user,
            isLoggedIn: true,
            token: data.token,
          }),
        )

        // Also store the token in sessionStorage for API requests
        if (data.token) {
          sessionStorage.setItem("auth_token", data.token)
        }

        console.log("Redirecting to admin dashboard")

        // Use window.location for a hard redirect
        window.location.href = "/admin"
        return
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error("Admin login error:", err)
      setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@tokiconnect.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* For development purposes only - remove in production */}
          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-center text-muted-foreground mb-2">For development purposes only</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={async () => {
                try {
                  console.log("Creating test admin user")
                  // Create a test admin user if it doesn't exist
                  const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      firstName: "Admin",
                      lastName: "User",
                      email: "admin@tokiconnect.com",
                      password: "admin123",
                      role: "admin",
                    }),
                  })

                  const data = await response.json()
                  console.log("Create admin response:", data)

                  // Pre-fill the form with admin credentials
                  setEmail("admin@tokiconnect.com")
                  setPassword("admin123")
                } catch (error) {
                  console.error("Error creating admin user:", error)
                }
              }}
            >
              Create Admin Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
