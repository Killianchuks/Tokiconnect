"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Message {
  id: string
  sender: string
  recipient: string
  subject: string
  date: string
  status: "Read" | "Sent" | "Pending"
}

interface MessageStats {
  totalMessages: number
  unread: number
  sentToday: number
  supportTickets: number
}

export default function MessagesPage() {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // In a real app, you would fetch this data from an API
        // For now, we'll simulate an API call with a timeout
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Simulate empty data initially
        setMessages([])
        setStats({
          totalMessages: 0,
          unread: 0,
          sentToday: 0,
          supportTickets: 0,
        })
      } catch (error) {
        console.error("Failed to fetch messages data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSearch = () => {
    // Implement search functionality
    console.log("Search messages:", searchQuery)
  }

  const handleComposeMessage = () => {
    // Implement compose message functionality
    console.log("Compose new message")
  }

  const handleViewMessage = (messageId: string) => {
    // Implement view message functionality
    console.log("View message:", messageId)
  }

  const handleReplyMessage = (messageId: string) => {
    // Implement reply message functionality
    console.log("Reply to message:", messageId)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
        <Button onClick={handleComposeMessage}>Compose Message</Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          className="max-w-sm"
          placeholder="Search messages..."
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
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalMessages}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.unread}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.sentToday}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.supportTickets}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
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
                  <TableHead>Sender</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No messages found
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">{message.sender}</TableCell>
                      <TableCell>{message.recipient}</TableCell>
                      <TableCell>{message.subject}</TableCell>
                      <TableCell>{message.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            message.status === "Read" ? "outline" : message.status === "Sent" ? "default" : "secondary"
                          }
                          className={
                            message.status === "Read"
                              ? ""
                              : message.status === "Sent"
                                ? "bg-green-500"
                                : "bg-yellow-500"
                          }
                        >
                          {message.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewMessage(message.id)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleReplyMessage(message.id)}>
                            Reply
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
    </div>
  )
}
