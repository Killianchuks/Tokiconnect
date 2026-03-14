"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lessonCreated, setLessonCreated] = useState(false)

  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    const createLessonFromSession = async () => {
      console.log("[v0] Success page loaded, sessionId:", sessionId)
      if (!sessionId) {
        setError("No session ID found")
        setLoading(false)
        return
      }

      try {
        // Verify the session and create the lesson
        console.log("[v0] Calling verify-session API...")
        const response = await fetch("/api/payments/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()
        console.log("[v0] verify-session response:", response.status, data)

        if (response.ok && data.success) {
          setLessonCreated(true)
        } else if (data.alreadyProcessed) {
          // Session was already processed (by webhook or previous visit)
          setLessonCreated(true)
        } else {
          setError(data.error || "Failed to verify payment")
        }
      } catch (err) {
        console.error("[v0] Error verifying session:", err)
        setError("An error occurred while verifying your payment")
      } finally {
        setLoading(false)
      }
    }

    createLessonFromSession()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#8B5A2B] mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your booking...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Booking Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-green-100 rounded-full p-3 w-fit">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription>
            Your lesson has been successfully booked. You will receive a confirmation email shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-[#8B5A2B]" />
            <p className="text-sm text-muted-foreground">
              Check your schedule to see the lesson details
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full bg-[#8B5A2B] hover:bg-[#6B4423]">
              <Link href="/dashboard/schedule">
                View My Schedule
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
