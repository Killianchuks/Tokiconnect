"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Download, DollarSign, Percent, CreditCard, Users } from "lucide-react"
import { financeService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Define TypeScript interfaces for our data structures
interface Transaction {
  id: string
  date: string
  teacher: string
  student: string
  type: string
  amount: number
  platformFee: number
  teacherEarnings: number
  status: string
}

interface Payout {
  id: string
  date: string
  teacher: string
  amount: number
  method: string
  status: string
}

interface CommissionSettings {
  standard: number
  premium: number
  newTeacher: number
  [key: string]: number
}

interface FinancialStats {
  revenue: { total: number; percentChange: number; target: number }
  platformEarnings: { total: number; percentChange: number }
  teacherPayouts: { total: number; percentChange: number }
  subscriptions: { total: number; percentChange: number }
}

interface TransactionsResponse {
  financialStats?: FinancialStats
}

export default function FinancesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>({
    standard: 12,
    premium: 10,
    newTeacher: 8,
  })
  const [editingCommission, setEditingCommission] = useState<string | null>(null)
  const [newCommissionValue, setNewCommissionValue] = useState("")
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    revenue: { total: 0, percentChange: 0, target: 100000 },
    platformEarnings: { total: 0, percentChange: 0 },
    teacherPayouts: { total: 0, percentChange: 0 },
    subscriptions: { total: 0, percentChange: 0 },
  })
  const [transactionFilter, setTransactionFilter] = useState("all")

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    setIsLoading(true)
    try {
      // Fetch financial stats
      const stats = (await financeService.getTransactions({ stats: true })) as TransactionsResponse
      setFinancialStats(
        stats.financialStats || {
          revenue: { total: 0, percentChange: 0, target: 100000 },
          platformEarnings: { total: 0, percentChange: 0 },
          teacherPayouts: { total: 0, percentChange: 0 },
          subscriptions: { total: 0, percentChange: 0 },
        },
      )

      // Fetch transactions
      const transactionsData = (await financeService.getTransactions()) as Transaction[]
      setTransactions(transactionsData || [])

      // Fetch payouts
      const payoutsData = (await financeService.getPayouts()) as Payout[]
      setPayouts(payoutsData || [])

      // Fetch commission settings
      const settings = (await financeService.getCommissionSettings()) as CommissionSettings
      setCommissionSettings(
        settings || {
          standard: 12,
          premium: 10,
          newTeacher: 8,
        },
      )
    } catch (error) {
      console.error("Error fetching financial data:", error)
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterTransactions = async (type: string) => {
    setTransactionFilter(type)
    try {
      const filters = type !== "all" ? { type } : {}
      const transactionsData = (await financeService.getTransactions(filters)) as Transaction[]
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error("Error filtering transactions:", error)
      toast({
        title: "Error",
        description: "Failed to filter transactions",
        variant: "destructive",
      })
    }
  }

  const handleProcessPayouts = async () => {
    try {
      await financeService.processPayouts({})
      toast({
        title: "Payouts Processed",
        description: "Teacher payouts have been processed successfully",
      })
      fetchFinancialData()
    } catch (error) {
      console.error("Error processing payouts:", error)
      toast({
        title: "Error",
        description: "Failed to process payouts",
        variant: "destructive",
      })
    }
  }

  const handleEditCommission = (type: string) => {
    setEditingCommission(type)
    setNewCommissionValue(commissionSettings[type].toString())
  }

  const handleSaveCommission = async () => {
    try {
      const value = Number.parseFloat(newCommissionValue)
      if (isNaN(value) || value < 0 || value > 100) {
        throw new Error("Commission must be a number between 0 and 100")
      }

      if (editingCommission === null) {
        throw new Error("No commission type selected")
      }

      const updatedSettings = {
        ...commissionSettings,
        [editingCommission]: value,
      }

      await financeService.updateCommissionSettings(updatedSettings)
      setCommissionSettings(updatedSettings)
      toast({
        title: "Commission Updated",
        description: `${editingCommission.charAt(0).toUpperCase() + editingCommission.slice(1)} commission rate has been updated to ${value}%`,
      })
      setEditingCommission(null)
    } catch (error) {
      console.error("Error updating commission:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update commission rate",
        variant: "destructive",
      })
    }
  }

  const handleExportData = () => {
    toast({
      title: "Exporting Data",
      description: "Your financial data is being exported",
    })
    // In a real app, this would trigger a download of financial data
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <Button variant="outline" className="flex items-center gap-2" onClick={handleExportData}>
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialStats.revenue.total.toFixed(2)}</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500">+{financialStats.revenue.percentChange}%</span>
              <span className="ml-1 text-xs text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Earnings</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialStats.platformEarnings.total.toFixed(2)}</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-muted-foreground">{commissionSettings.standard}% commission rate</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teacher Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialStats.teacherPayouts.total.toFixed(2)}</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-muted-foreground">
                {100 - commissionSettings.standard}% of total revenue
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialStats.subscriptions.total}</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500">+{financialStats.subscriptions.percentChange}%</span>
              <span className="ml-1 text-xs text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Teacher Payouts</TabsTrigger>
          <TabsTrigger value="commission">Commission Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>View all platform transactions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue={transactionFilter} onValueChange={handleFilterTransactions}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="lesson">Lessons</SelectItem>
                      <SelectItem value="subscription">Subscriptions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <p>Loading transactions...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Platform Fee ({commissionSettings.standard}%)</TableHead>
                      <TableHead>Teacher Earnings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.teacher}</TableCell>
                          <TableCell>{transaction.student}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === "subscription" ? "default" : "outline"}>
                              {transaction.type === "subscription" ? "Subscription" : "Single Lesson"}
                            </Badge>
                          </TableCell>
                          <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                          <TableCell>${transaction.platformFee.toFixed(2)}</TableCell>
                          <TableCell>${transaction.teacherEarnings.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Teacher Payouts</CardTitle>
                  <CardDescription>Manage payments to teachers</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={handleProcessPayouts}>
                    Process New Payouts
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <p>Loading payouts...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.length > 0 ? (
                      payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{payout.date}</TableCell>
                          <TableCell>{payout.teacher}</TableCell>
                          <TableCell>${payout.amount.toFixed(2)}</TableCell>
                          <TableCell>{payout.method}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                              {payout.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "View Details",
                                  description: `Viewing details for payout to ${payout.teacher}`,
                                })
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No payouts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings</CardTitle>
              <CardDescription>Configure platform commission rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border p-4 rounded-md">
                  <div>
                    <h3 className="font-medium">Standard Commission Rate</h3>
                    <p className="text-sm text-muted-foreground">Applied to all transactions by default</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{commissionSettings.standard}%</span>
                    <Button variant="outline" size="sm" onClick={() => handleEditCommission("standard")}>
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between border p-4 rounded-md">
                  <div>
                    <h3 className="font-medium">Premium Teacher Commission Rate</h3>
                    <p className="text-sm text-muted-foreground">For teachers with 4.8+ rating and 50+ lessons</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{commissionSettings.premium}%</span>
                    <Button variant="outline" size="sm" onClick={() => handleEditCommission("premium")}>
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between border p-4 rounded-md">
                  <div>
                    <h3 className="font-medium">New Teacher Promotion</h3>
                    <p className="text-sm text-muted-foreground">For first 10 lessons of new teachers</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{commissionSettings.newTeacher}%</span>
                    <Button variant="outline" size="sm" onClick={() => handleEditCommission("newTeacher")}>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 p-4 rounded-md">
                <h3 className="font-medium mb-2">Commission History</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>April 1, 2025</span>
                    <span>Changed from 15% to 12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>January 15, 2025</span>
                    <span>Added Premium Teacher tier (10%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>October 1, 2024</span>
                    <span>Platform launch with 15% commission</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Commission Dialog */}
      <Dialog open={!!editingCommission} onOpenChange={(open) => !open && setEditingCommission(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Commission Rate</DialogTitle>
            <DialogDescription>
              Update the commission rate for{" "}
              {editingCommission ? editingCommission.replace(/([A-Z])/g, " $1").toLowerCase() : ""} tier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Commission Rate (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newCommissionValue}
                onChange={(e) => setNewCommissionValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCommission(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCommission} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
