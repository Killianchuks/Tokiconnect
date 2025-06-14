"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "student",
  })
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRoleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value,
    }))
  }

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    setDebugInfo(null)

    try {
      // Validate form data
      if (!formData.firstName || !formData.lastName) {
        setError("First and last name are required")
        setIsLoading(false)
        return
      }

      if (!formData.email) {
        setError("Email is required")
        setIsLoading(false)
        return
      }

      if (!validateEmail(formData.email)) {
        setError("Please enter a valid email address")
        setIsLoading(false)
        return
      }

      if (!formData.password) {
        setError("Password is required")
        setIsLoading(false)
        return
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long")
        setIsLoading(false)
        return
      }

      console.log("📤 Sending registration data:", formData)

      // First check database connection
      const dbCheckResponse = await fetch("/api/debug/db-status")
      const dbStatus = await dbCheckResponse.json()

      if (!dbStatus.success) {
        setError(`Database connection error: ${dbStatus.message}`)
        setDebugInfo(dbStatus)
        setIsLoading(false)
        return
      }

      // Send registration request
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("📥 Registration response:", data)
      setDebugInfo(data)

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Registration failed")
      }

      // Store user data in localStorage for demo purposes
      localStorage.setItem(
        "linguaConnectUser",
        JSON.stringify({
          ...formData,
          id: data.userId || `user-${Date.now()}`,
          isLoggedIn: true,
        }),
      )

      setSuccess("Account created successfully! Redirecting to dashboard...")

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error: unknown) {
      console.error("❌ Registration error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during signup. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Demo account creation
  const createDemoAccount = (role: string) => {
    const demoUser = {
      firstName: role === "student" ? "Demo" : "Teacher",
      lastName: "User",
      email: `${role}@example.com`,
      password: "password123",
      role: role,
      id: `demo-${Date.now()}`,
      isLoggedIn: true,
    }

    localStorage.setItem("linguaConnectUser", JSON.stringify(demoUser))
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="relative h-12 w-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B5A2B] text-white text-lg font-bold">
                LC
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign up</CardTitle>
          <CardDescription className="text-center">Create an account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
            </div>
            <div className="space-y-2">
              <Label>I want to</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === "student"}
                    onChange={handleRoleChange}
                    className="h-4 w-4"
                  />
                  <span>Learn a language</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === "teacher"}
                    onChange={handleRoleChange}
                    className="h-4 w-4"
                  />
                  <span>Teach a language</span>
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500">Or try a demo account</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant="outline" onClick={() => createDemoAccount("student")} className="w-full">
                Student Demo
              </Button>
              <Button type="button" variant="outline" onClick={() => createDemoAccount("teacher")} className="w-full">
                Teacher Demo
              </Button>
            </div>
          </form>

          {/* Debug information section */}
          {debugInfo && (
            <div className="mt-6 p-3 bg-gray-100 rounded-md text-xs overflow-auto max-h-40">
              <p className="font-semibold mb-1">Debug Information:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-600 w-full text-center">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#8B5A2B] hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
