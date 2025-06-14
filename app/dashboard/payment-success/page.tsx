"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [isLoading, setIsLoading] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!sessionId) return

      try {
        const response = await fetch(`/api/payments/session-details?session_id=${sessionId}`)

        if (response.ok) {
          const data = await response.json()
          setPaymentDetails(data)
        }
      } catch (error) {
        console.error("Error fetching payment details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [sessionId])

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>Your payment has been processed successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground">Loading payment details...</p>
            ) : paymentDetails ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-medium">${paymentDetails.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment ID:</span>
                  <span className="font-medium text-xs truncate max-w-[180px]">{sessionId}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Your payment has been confirmed. You can now access your lesson.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
              <Link href="/dashboard/schedule">
                View Your Schedule
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
