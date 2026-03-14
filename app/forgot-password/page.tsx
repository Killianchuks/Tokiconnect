"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import Link from "next/link"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [step, setStep] = useState<"request" | "verify" | "success">("request")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), action: "request" }),
      })

      const data = await res.json()

      if (res.ok) {
        setStep("verify")
      } else {
        setError(data.error || "Failed to send reset code")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword, action: "reset" }),
      })

      if (res.ok) {
        setStep("success")
      } else {
        const data = await res.json()
        setError(data.error || "Failed to reset password")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader showAuthButtons={false} />
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-[#8B5A2B] rounded-lg flex items-center justify-center">
              <Image src="/logo.png" alt="Toki Connect" width={40} height={40} className="invert" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              {step === "request" && "Enter your email to receive a reset code"}
              {step === "verify" && "Enter the code sent to your email"}
              {step === "success" && "Your password has been reset"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "request" && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-[#8B5A2B] hover:bg-[#6B4423]" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </Button>
              </form>
            )}

            {step === "verify" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                <div className="space-y-2">
                  <Label htmlFor="code">Reset Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-[#8B5A2B] hover:bg-[#6B4423]" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}

            {step === "success" && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">You can now log in with your new password.</p>
                <Link href="/login">
                  <Button className="w-full bg-[#8B5A2B] hover:bg-[#6B4423]">Go to Login</Button>
                </Link>
              </div>
            )}

            <div className="mt-4 text-center text-sm">
              <Link href="/login" className="text-[#8B5A2B] hover:underline">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
