"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SiteHeader } from "@/components/site-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "student"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      if (data.success && data.user) {
        // Store user in localStorage
        localStorage.setItem(
          "linguaConnectUser",
          JSON.stringify({
            ...data.user,
            isLoggedIn: true,
          }),
        )

        // Redirect based on user role
        if (data.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader showAuthButtons={false} />
      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="TOKI CONNECT Logo" width={80} height={80} />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-[#8B5A2B] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              <p>
                Don't have an account?{" "}
                <Link href={`/signup?role=${role}`} className="text-[#8B5A2B] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>

            {/* For development purposes only - remove in production */}
            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-center text-muted-foreground mb-2">For development purposes only</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    try {
                      // Create a test student user if it doesn't exist
                      await fetch("/api/auth/register", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          firstName: "Test",
                          lastName: "Student",
                          email: "student@test.com",
                          password: "password123",
                          role: "student",
                        }),
                      })

                      // Pre-fill the form with test credentials
                      setEmail("student@test.com")
                      setPassword("password123")
                    } catch (error) {
                      console.error("Error creating test user:", error)
                    }
                  }}
                >
                  Test Student
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    try {
                      // Create a test teacher user if it doesn't exist
                      await fetch("/api/auth/register", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          firstName: "Test",
                          lastName: "Teacher",
                          email: "teacher@test.com",
                          password: "password123",
                          role: "teacher",
                          hourlyRate: 25,
                        }),
                      })

                      // Pre-fill the form with test credentials
                      setEmail("teacher@test.com")
                      setPassword("password123")
                    } catch (error) {
                      console.error("Error creating test user:", error)
                    }
                  }}
                >
                  Test Teacher
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs col-span-2"
                  onClick={async () => {
                    try {
                      // Create a test admin user if it doesn't exist
                      await fetch("/api/auth/register", {
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

                      // Pre-fill the form with admin credentials
                      setEmail("admin@tokiconnect.com")
                      setPassword("admin123")
                    } catch (error) {
                      console.error("Error creating admin user:", error)
                    }
                  }}
                >
                  Admin Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="border-t py-6 md:py-0 bg-[#8B5A2B] text-white">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="TOKI CONNECT Logo" width={30} height={30} />
            <p className="text-sm">© 2025 TOKI CONNECT. All rights reserved.</p>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link
              href="mailto:support@tokiconnect.com"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
