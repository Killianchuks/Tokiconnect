"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, AlertCircle } from "lucide-react"
import type { Conversation, Message, UserData } from "@/app/types/message"

export default function MessagesPage() {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConversationsLoading, setIsConversationsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const lessonIdFromQuery = searchParams.get("lessonId")

  useEffect(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("linguaConnectUser")
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setUserData(user)
          fetchConversations(user.id)
        } else {
          setIsLoading(false)
          setIsConversationsLoading(false)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Failed to load user data. Please try logging in again.")
        setIsLoading(false)
        setIsConversationsLoading(false)
      }
    }
  }, [])

  const fetchConversations = async (userId: string | number) => {
    setIsConversationsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/users/${userId}/conversations`)

      if (!response.ok) {
        if (response.status === 404) {
          // No conversations yet, not an error
          setConversations([])
          setIsLoading(false)
          setIsConversationsLoading(false)
          return
        }

        // Try to parse the error message from the response
        const errorBody = await response.json().catch(() => null)
        const errorMessage = errorBody?.error || errorBody?.message || `Failed to fetch conversations: ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        console.warn("Invalid conversations data format:", data)
        setConversations([])
      } else {
        const conversationsData = data as Conversation[]

        // Deduplicate conversations by partner (avoid showing multiple threads for the same person)
        const conversationsByPartner = new Map<string | number, Conversation>()

        for (const conv of conversationsData) {
          if (!conv.partnerId) {
            continue
          }

          const existing = conversationsByPartner.get(conv.partnerId)
          const convTime = conv.lastMessageTime ? new Date(conv.lastMessageTime).getTime() : 0
          const existingTime = existing?.lastMessageTime ? new Date(existing.lastMessageTime).getTime() : 0

          if (!existing) {
            conversationsByPartner.set(conv.partnerId, conv)
          } else {
            // Keep the latest message timestamp and add unread counts together
            const updated = {
              ...existing,
              unreadCount: (existing.unreadCount || 0) + (conv.unreadCount || 0),
              ...(convTime > existingTime ? { lastMessage: conv.lastMessage, lastMessageTime: conv.lastMessageTime, id: conv.id } : {}),
            }
            conversationsByPartner.set(conv.partnerId, updated)
          }
        }

        const dedupedConversations = Array.from(conversationsByPartner.values()).sort(
          (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime(),
        )

        // Keep the raw list for selecting by lesson ID (if requested), but display a deduped list
        const rawConversations = conversationsData
        setConversations(dedupedConversations)

        // Try to select a conversation based on query param (lessonId)
        const selectedFromQuery = lessonIdFromQuery
          ? rawConversations.find((conv) => String(conv.id) === lessonIdFromQuery)
          : null

        if (selectedFromQuery) {
          setSelectedConversation(selectedFromQuery)
          fetchMessages(selectedFromQuery.id)
          return
        }

        // If no conversations exist but we were asked to open a specific lesson, try to fetch it
        if (dedupedConversations.length === 0 && lessonIdFromQuery) {
          const lessonConversation = await fetchLessonConversation(lessonIdFromQuery, userId)
          if (lessonConversation) {
            setConversations([lessonConversation])
            setSelectedConversation(lessonConversation)
            fetchMessages(lessonConversation.id)
            return
          }
        }

        // Otherwise, select the first available conversation
        if (dedupedConversations.length > 0) {
          setSelectedConversation(dedupedConversations[0])
          fetchMessages(dedupedConversations[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
      const errMessage = (error as any)?.message || "Failed to load conversations. Please try again later."
      setError(errMessage)
      toast({
        title: "Error",
        description: errMessage,
        variant: "destructive",
      })
      setConversations([])
    } finally {
      setIsLoading(false)
      setIsConversationsLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string | number) => {
    setIsMessagesLoading(true)
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?userId=${encodeURIComponent(String(userData?.id || ""))}`
      )

      if (!response.ok) {
        if (response.status === 404) {
          // No messages yet, not an error
          setMessages([])
          setIsMessagesLoading(false)
          return
        }

        const errorBody = await response.json().catch(() => null)
        const errorMessage = errorBody?.error || errorBody?.message || `Failed to fetch messages: ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        console.warn("Invalid messages data format:", data)
        setMessages([])
      } else {
        setMessages(data as Message[])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again later.",
        variant: "destructive",
      })
      setMessages([])
    } finally {
      setIsLoading(false)
      setIsMessagesLoading(false)
    }
  }

  const fetchLessonConversation = async (lessonId: string, userId: string | number) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`)
      if (!response.ok) return null

      const lesson = await response.json()
      const isStudent = String(lesson.studentId) === String(userId)

      const partnerName = isStudent
        ? `${lesson.teacherFirstName || ""} ${lesson.teacherLastName || ""}`.trim()
        : `${lesson.studentFirstName || ""} ${lesson.studentLastName || ""}`.trim()

      const partnerAvatar = isStudent ? lesson.teacherProfileImage : lesson.studentProfileImage
      const partnerId = isStudent ? lesson.teacherId : lesson.studentId

      return {
        id: lesson.id,
        partnerId,
        name: partnerName || "Conversation",
        avatar: partnerAvatar,
        lastMessage: `Lesson on ${new Date(lesson.startTime).toLocaleDateString()}`,
        lastMessageTime: lesson.startTime,
        status: lesson.status,
        metadata: {
          meetingLink: lesson.meetingLink,
          language: lesson.language,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          durationMinutes: lesson.durationMinutes,
        },
      }
    } catch (error) {
      console.warn("Failed to fetch lesson for conversation:", error)
      return null
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    // Mark as read locally immediately for badge UI
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv,
      ),
    )
    fetchMessages(conversation.id)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !userData) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.id,
          content: newMessage,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || "Failed to send message")
      }

      // Add the new message to the list
      const sentMessage = await response.json()
      setMessages([...messages, sentMessage])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      const message = (error as any)?.message || "Failed to send message. Please try again."
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (timestamp?: string | Date): string => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const filteredConversations = searchQuery
    ? conversations.filter((conv) => conv.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations

  if (!userData) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-center justify-center min-h-[60vh] flex-col">
          <p className="text-xl mb-4">Please log in to view your messages</p>
          <Button asChild>
            <a href="/login">Log In</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
          <p className="text-sm text-red-700">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-700 hover:text-red-600"
            onClick={() => fetchConversations(userData.id)}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <Input
              placeholder="Search conversations..."
              className="w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[calc(100vh-280px)]">
            {isConversationsLoading ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground font-medium">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  {searchQuery
                    ? "No conversations match your search"
                    : "Start by finding a teacher and sending a message"}
                </p>
                {!searchQuery && (
                  <Button className="mt-4" asChild>
                    <a href="/dashboard/find-teachers">Find Teachers</a>
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                    selectedConversation?.id === conversation.id ? "bg-muted" : ""
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={conversation.name || "User"} />
                      <AvatarFallback>{(conversation.name || "User").substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{conversation.name || "User"}</p>
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount ? (
                            <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-red-500 text-[10px] font-semibold text-white">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                          <p className="text-xs text-muted-foreground">{formatTime(conversation.lastMessageTime)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage || "No messages"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Messages */}
        <div className="border rounded-lg overflow-hidden md:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center space-x-4">
                <Avatar>
                  <AvatarImage
                    src={selectedConversation.avatar || "/placeholder.svg"}
                    alt={selectedConversation.name || "User"}
                  />
                  <AvatarFallback>{(selectedConversation.name || "User").substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedConversation.name || "User"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.role || "User"} • {selectedConversation.status || "Offline"}
                  </p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4 h-[calc(100vh-380px)]">
                {isMessagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                        <div className={`max-w-[80%] ${i % 2 === 0 ? "bg-primary/10" : "bg-muted"} rounded-lg p-3`}>
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px] mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground font-medium">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Start the conversation by sending a message</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCurrentUser = message.senderId === userData.id
                      return (
                        <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : ""}`}>
                          <div
                            className={`max-w-[80%] ${
                              isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                            } rounded-lg p-3`}
                          >
                            <p>{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-4">
              <div>
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground font-medium">Select a conversation</p>
                {conversations.length === 0 && !isConversationsLoading && (
                  <>
                    <p className="text-sm text-muted-foreground mt-2 max-w-[300px] mx-auto">
                      No conversations yet. Start by finding a teacher and sending a message.
                    </p>
                    <Button className="mt-6" asChild>
                      <a href="/dashboard/find-teachers">Find Teachers</a>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
