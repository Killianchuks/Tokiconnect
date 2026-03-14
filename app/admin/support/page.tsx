"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Send, Eye, CheckCircle } from "lucide-react"

interface SupportTicket {
  id: string
  user_id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  first_name: string
  last_name: string
  email: string
  user_role: string
}

interface Message {
  id: number
  message: string
  is_admin_reply: boolean
  created_at: string
  first_name: string
  last_name: string
  user_role: string
}

export default function AdminSupportPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newReply, setNewReply] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Get admin user from localStorage
  const getAdminId = () => {
    try {
      const adminUser = localStorage.getItem("adminUser")
      if (adminUser) {
        const parsed = JSON.parse(adminUser)
        return parsed.id || "admin"
      }
    } catch {
      return "admin"
    }
    return "admin"
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append("isAdmin", "true")
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/support/tickets?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (ticketId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setIsDialogOpen(true)
    fetchMessages(ticket.id)
  }

  const handleSendReply = async () => {
    if (!selectedTicket || !newReply.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: getAdminId(),
          message: newReply,
          isAdminReply: true,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, {
          ...data.message,
          first_name: "Support",
          last_name: "Team",
          user_role: "admin"
        }])
        setNewReply("")
        toast({
          title: "Reply sent",
          description: "Your reply has been sent to the user.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reply.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/support/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          status: newStatus,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTickets(tickets.map(t => 
          t.id === ticketId ? { ...t, status: newStatus } : t
        ))
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus })
        }
        toast({
          title: "Status updated",
          description: `Ticket marked as ${newStatus.replace("_", " ")}. ${newStatus === "resolved" ? "User has been notified." : ""}`,
        })
      } else {
        throw new Error(data.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500">Open</Badge>
      case "in_progress":
        return <Badge className="bg-yellow-500">In Progress</Badge>
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="outline" className="border-red-500 text-red-500">Urgent</Badge>
      case "high":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">High</Badge>
      case "medium":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium</Badge>
      case "low":
        return <Badge variant="outline" className="border-green-500 text-green-500">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === "open").length,
    inProgressTickets: tickets.filter(t => t.status === "in_progress").length,
    avgResponseTime: "N/A",
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
              onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchTickets}>
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
                  <div className="text-2xl font-bold">{stats.totalTickets}</div>
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
                  <div className="text-2xl font-bold">{stats.openTickets}</div>
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
                  <div className="text-2xl font-bold">{stats.inProgressTickets}</div>
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
                  <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
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
                          <TableCell>
                            <div>
                              <p className="font-medium">{ticket.first_name} {ticket.last_name}</p>
                              <p className="text-sm text-muted-foreground">{ticket.email}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {ticket.user_role}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                          <TableCell className="capitalize">{ticket.category}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{formatDate(ticket.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewTicket(ticket)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {ticket.status !== "resolved" && ticket.status !== "closed" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateStatus(ticket.id, "resolved")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                              )}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.subject}
              {selectedTicket && getStatusBadge(selectedTicket.status)}
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.id} | {selectedTicket?.first_name} {selectedTicket?.last_name} ({selectedTicket?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Original Message */}
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  {selectedTicket && getPriorityBadge(selectedTicket.priority)}
                  <Badge variant="outline" className="capitalize">{selectedTicket?.category}</Badge>
                </div>
                {selectedTicket && (
                  <Select 
                    value={selectedTicket.status} 
                    onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <p className="text-sm">{selectedTicket?.description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Created: {selectedTicket && formatDate(selectedTicket.created_at)}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[250px]">
              {loadingMessages ? (
                <p className="text-center text-muted-foreground">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No replies yet. Send a reply below.
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.is_admin_reply ? "bg-[#8B5A2B]/10 ml-8" : "bg-muted mr-8"
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">
                      {msg.is_admin_reply ? "Support Team" : `${msg.first_name} ${msg.last_name}`}
                    </p>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(msg.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input */}
            {selectedTicket?.status !== "closed" && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button
                  className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90 self-end"
                  onClick={handleSendReply}
                  disabled={submitting || !newReply.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
