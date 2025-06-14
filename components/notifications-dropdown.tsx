"use client"

import { useState } from "react"
import { Bell, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    title: "New message from Maria Garcia",
    description: "Hello! I'm looking forward to our Spanish lesson tomorrow.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    title: "Lesson reminder",
    description: "Your Spanish lesson with Maria Garcia is scheduled for tomorrow at 10:00 AM.",
    time: "5 hours ago",
    read: false,
  },
  {
    id: 3,
    title: "Payment successful",
    description: "Your payment for the Spanish lesson package has been processed successfully.",
    time: "Yesterday",
    read: true,
  },
  {
    id: 4,
    title: "New language added",
    description: "We've added 5 new languages to our platform. Check them out!",
    time: "3 days ago",
    read: true,
  },
]

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const handleNotificationClick = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
    // In a real app, this would navigate to the relevant page or show more details
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#8B5A2B]"></span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn("flex flex-col items-start p-3 cursor-pointer", !notification.read && "bg-muted/50")}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="font-medium text-sm">{notification.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{notification.description}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {notification.time}
                  {notification.read && <Check className="h-3 w-3 ml-2 text-green-500" />}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">No notifications</div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-sm" asChild>
          <a href="/dashboard/notifications">View all notifications</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
