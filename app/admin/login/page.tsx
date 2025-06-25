"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { authService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const checkInitialAuth = async () => {
      setIsAuthChecking(true)
      setError("")

      try {
        console.log("[AdminLogin] Checking if already authenticated as admin...")
        const currentUser = await authService.getCurrentUser()

        if (currentUser && currentUser.role === "admin") {
          console.log("[AdminLogin] Already logged in as admin. Redirecting to dashboard.")
          router.replace("/admin")
        } else {
          console.log("[AdminLogin] Not authenticated as admin, proceed with login form.")
          setIsAuthChecking(false)
        }
      } catch (err) {
        console.error("[AdminLogin] Error during initial auth check:", err)
        setIsAuthChecking(false)
      }
    }

    checkInitialAuth()
  }, [isClient, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("[AdminLogin] Attempting admin login with:", email)
      const response = await authService.adminLogin({ email, password })
      console.log("[AdminLogin] Login API response:", response)

      if (!response || !response.user || response.success === false) {
        throw new Error(response.message || "Invalid email or password.")
      }

      if (response.user.role !== "admin") {
        throw new Error("You do not have permission to access the admin area.")
      }

      console.log("[AdminLogin] Admin login successful. Redirecting to dashboard.")
      router.replace("/admin")
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard!",
        variant: "default",
      })
    } catch (err) {
      console.error("[AdminLogin] Admin login error:", err)
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
      setError(errorMessage)
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient || isAuthChecking) {
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
            <p className="text-xs text-center text-muted-foreground mb-2">
              For development purposes only
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={async () => {
                try {
                  console.log("Creating test admin user")
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
                  toast({
                    title: data.success ? "Success" : "Error",
                    description:
                      data.message ||
                      (data.success
                        ? "Admin account created."
                        : "Failed to create admin account."),
                    variant: data.success ? "default" : "destructive",
                  })

                  setEmail("admin@tokiconnect.com")
                  setPassword("admin123")
                } catch (error) {
                  console.error("Error creating admin user:", error)
                  toast({
                    title: "Error",
                    description: "Failed to create admin account.",
                    variant: "destructive",
                  })
                }
              }}
            >
              Create Test Admin Account (Dev Only)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
