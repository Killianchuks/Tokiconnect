"use client"

import { X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PaymentCanceledPage() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Payment Canceled</CardTitle>
            <CardDescription>Your payment was not completed.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              The payment process was canceled. No charges have been made to your account.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
              <Link href="/dashboard/find-teachers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Find Teachers
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
