"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") || ""
  
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, action: "verify" }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 2000)
      } else if (data.alreadyVerified) {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 2000)
      } else {
        setError(data.error || "Invalid code")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "resend" }),
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setError("") // Clear any errors
        alert("Verification code sent! Check your email.")
      } else {
        setError(data.error || "Failed to resend code")
      }
    } catch {
      setError("Failed to resend code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-[#8B5A2B] rounded-lg flex items-center justify-center">
          <Image src="/logo.png" alt="Toki Connect" width={40} height={40} className="invert" />
        </div>
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          {success ? "Email verified!" : `Enter the code sent to ${email || "your email"}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center space-y-4">
            <p className="text-green-600">Your email has been verified. Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full bg-[#8B5A2B] hover:bg-[#6B4423]" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={isLoading}
            >
              Resend Code
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function VerifyEmailSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Skeleton className="mx-auto mb-4 w-16 h-16 rounded-lg" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader showAuthButtons={false} />
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Suspense fallback={<VerifyEmailSkeleton />}>
          <VerifyEmailContent />
        </Suspense>
      </main>
    </div>
  )
}
