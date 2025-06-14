"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supportService } from "@/lib/api-service"
import { Skeleton } from "@/components/ui/skeleton"

interface SupportTicket {
  id: string
  user: string
  subject: string
  category: string
  priority: "High" | "Medium" | "Low"
  status: "Open" | "In Progress" | "Closed"
  created: string
}

interface SupportStats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  avgResponseTime: string
}

export default function SupportPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<SupportStats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [ticketsData, statsData] = await Promise.all([
          supportService.getTickets(),
          supportService.getSupportStats(),
        ])
        setTickets(ticketsData)
        setStats(statsData)
      } catch (error) {
        console.error("Failed to fetch support data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSearch = async () => {
    try {
      setLoading(true)
      const filteredTickets = await supportService.getTickets({ query: searchQuery })
      setTickets(filteredTickets)
    } catch (error) {
      console.error("Failed to search tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewTicket = (ticketId: string) => {
    // Implement view ticket functionality
    console.log("View ticket:", ticketId)
  }

  const handleAssignTicket = (ticketId: string) => {
    // Implement assign ticket functionality
    console.log("Assign ticket:", ticketId)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Support</h2>
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="faq">FAQ Management</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              className="max-w-sm"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline" onClick={handleSearch}>
              Search
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[80px]" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalTickets}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[80px]" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.openTickets}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[80px]" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.inProgressTickets}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[80px]" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.avgResponseTime}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.id}</TableCell>
                          <TableCell>{ticket.user}</TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>{ticket.category}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                ticket.priority === "High"
                                  ? "border-red-500 text-red-500"
                                  : ticket.priority === "Medium"
                                    ? "border-yellow-500 text-yellow-500"
                                    : "border-green-500 text-green-500"
                              }
                            >
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.status === "Open"
                                  ? "default"
                                  : ticket.status === "In Progress"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                ticket.status === "Open"
                                  ? "bg-red-500"
                                  : ticket.status === "In Progress"
                                    ? "bg-yellow-500"
                                    : ""
                              }
                            >
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{ticket.created}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket.id)}>
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleAssignTicket(ticket.id)}>
                                Assign
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button>Add New FAQ</Button>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No FAQs found. Add your first FAQ.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button>Add New Article</Button>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No articles found. Add your first article.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
