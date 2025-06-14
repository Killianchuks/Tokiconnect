"use client"

import { useEffect, useState } from "react"
import { CreditCard, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types for our data
type Transaction = {
  id: string
  studentName: string
  date: string
  amount: number
  status: "Paid" | "Pending" | "Failed"
}

type EarningsData = {
  thisMonth: number
  pending: number
  total: number
}

export default function EarningsPage() {
  const [selectedMonth, setSelectedMonth] = useState("current")
  const [isLoading, setIsLoading] = useState(true)
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Fetch earnings data
  useEffect(() => {
    // Simulate loading
    setIsLoading(true)

    // In a real app, this would be an API call
    setTimeout(() => {
      setIsLoading(false)

      // Set empty data instead of mock data
      setEarnings({
        thisMonth: 0,
        pending: 0,
        total: 0,
      })

      setTransactions([])
    }, 1000)
  }, [selectedMonth])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground">Manage your income and payment methods</p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="previous">Previous Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              This Month
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Earnings for the current month after platform fee</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings?.thisMonth || 0)}</div>
            <p className="text-xs text-muted-foreground">After 15% platform fee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings?.pending || 0)}</div>
            <p className="text-xs text-muted-foreground">Will be paid on the 1st</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings?.total || 0)}</div>
            <p className="text-xs text-muted-foreground">Since you joined</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your earnings from lessons</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-4 gap-4 p-4 font-medium">
                  <div>Student</div>
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="grid grid-cols-4 gap-4 p-4">
                      <div>{transaction.studentName}</div>
                      <div className="text-muted-foreground">{transaction.date}</div>
                      <div>{formatCurrency(transaction.amount)}</div>
                      <div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            transaction.status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Info className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
              <p className="text-muted-foreground max-w-sm">
                When you start teaching lessons, your earnings will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage how you receive your earnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No payment methods</h3>
            <p className="text-muted-foreground max-w-sm mb-4">Add a payment method to receive your earnings.</p>
            <Button>Add Payment Method</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
