"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PaymentButtonProps {
  teacherId: string
  lessonType: string
  lessonDate?: string
  lessonDuration?: string
  amount: number
  buttonText?: string
  className?: string
}

export function PaymentButton({
  teacherId,
  lessonType,
  lessonDate,
  lessonDuration,
  amount,
  buttonText = "Pay Now",
  className,
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId,
          lessonType,
          lessonDate,
          lessonDuration,
          amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handlePayment} disabled={isLoading} className={`bg-[#8B5A2B] hover:bg-[#8B5A2B]/90 ${className}`}>
      {isLoading ? "Processing..." : buttonText}
    </Button>
  )
}
