"use client"

import type React from "react"

import { useState } from "react"
import { Download, FileText, Filter, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDateRange((prev) => ({ ...prev, [name]: value }))
  }

  const generateReport = (reportType: string) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast({
        title: "Missing Date Range",
        description: "Please select both start and end dates",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
      toast({
        title: "Report Generated",
        description: `${reportType} report has been generated successfully.`,
      })
    }, 2000)
  }

  const downloadReport = (reportType: string) => {
    toast({
      title: "Download Started",
      description: `${reportType} report is being downloaded.`,
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Date Range</CardTitle>
            <CardDescription>Select the date range for your reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" name="endDate" type="date" value={dateRange.endDate} onChange={handleDateChange} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList>
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          <TabsTrigger value="user">User Reports</TabsTrigger>
          <TabsTrigger value="lesson">Lesson Reports</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Report</CardTitle>
                <CardDescription>Total revenue breakdown by time period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-center justify-center border rounded-md">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => generateReport("Revenue")} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                <Button onClick={() => downloadReport("Revenue")} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Report</CardTitle>
                <CardDescription>Teacher payout history and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-center justify-center border rounded-md">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => generateReport("Payout")} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                <Button onClick={() => downloadReport("Payout")} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="user">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Report</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-center justify-center border rounded-md">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => generateReport("User Growth")} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                <Button onClick={() => downloadReport("User Growth")} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity Report</CardTitle>
                <CardDescription>User engagement and activity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-center justify-center border rounded-md">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => generateReport("User Activity")} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                <Button onClick={() => downloadReport("User Activity")} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lesson">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Completion Report</CardTitle>
                <CardDescription>Completed vs. canceled lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-center justify-center border rounded-md">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => generateReport("Lesson Completion")} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => downloadReport("Lesson Completion")}
                  className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teacher Performance Report</CardTitle>
                <CardDescription>Teacher ratings and lesson statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-center justify-center border rounded-md">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => generateReport("Teacher Performance")} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => downloadReport("Teacher Performance")}
                  className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report</CardTitle>
              <CardDescription>Create a custom report with specific parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input id="reportName" placeholder="Enter report name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <select
                  id="reportType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select report type</option>
                  <option value="financial">Financial</option>
                  <option value="user">User</option>
                  <option value="lesson">Lesson</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Additional Filters</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Add Filter
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => generateReport("Custom")}
                disabled={isGenerating}
                className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
