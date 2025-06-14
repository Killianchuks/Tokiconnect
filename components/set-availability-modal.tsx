"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, RefreshCw } from "lucide-react"

interface TimeSlot {
  id: string
  day: string
  startTime: string
  endTime: string
}

interface CalendarIntegration {
  type: "google" | "outlook" | "apple" | "calendly"
  connected: boolean
  lastSync?: string
  url?: string
}

interface SetAvailabilityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialAvailability?: TimeSlot[]
  onSave: (availability: TimeSlot[]) => void
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
]

export function SetAvailabilityModal({
  open,
  onOpenChange,
  initialAvailability = [],
  onSave,
}: SetAvailabilityModalProps) {
  const { toast } = useToast()
  const [availability, setAvailability] = useState<TimeSlot[]>(initialAvailability)
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0])
  const [startTime, setStartTime] = useState<string>(TIME_SLOTS[0])
  const [endTime, setEndTime] = useState<string>(TIME_SLOTS[2])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("manual")
  const [calendarUrl, setCalendarUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  // Mock calendar integrations
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([
    { type: "google", connected: false },
    { type: "outlook", connected: false },
    { type: "apple", connected: false },
    { type: "calendly", connected: false },
  ])

  // Load initial availability from localStorage if available
  useEffect(() => {
    if (initialAvailability && initialAvailability.length > 0) {
      setAvailability(initialAvailability)
    } else {
      // Try to load from localStorage
      const storedUser = localStorage.getItem("linguaConnectUser")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        const userId = userData.id || userData.email
        const storedAvailability = localStorage.getItem(`availability_${userId}`)
        if (storedAvailability) {
          try {
            const parsedAvailability = JSON.parse(storedAvailability)
            setAvailability(parsedAvailability)
          } catch (error) {
            console.error("Error parsing stored availability:", error)
          }
        }

        // Load calendar integrations
        const storedIntegrations = localStorage.getItem(`calendar_integrations_${userId}`)
        if (storedIntegrations) {
          try {
            const parsedIntegrations = JSON.parse(storedIntegrations)
            setIntegrations(parsedIntegrations)
          } catch (error) {
            console.error("Error parsing stored integrations:", error)
          }
        }
      }
    }
  }, [initialAvailability, open])

  const handleAddTimeSlot = () => {
    if (startTime >= endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      })
      return
    }

    const newSlot: TimeSlot = {
      id: `${selectedDay}-${startTime}-${endTime}`,
      day: selectedDay,
      startTime,
      endTime,
    }

    // Check for overlapping time slots
    const hasOverlap = availability.some(
      (slot) =>
        slot.day === selectedDay &&
        ((startTime >= slot.startTime && startTime < slot.endTime) ||
          (endTime > slot.startTime && endTime <= slot.endTime) ||
          (startTime <= slot.startTime && endTime >= slot.endTime)),
    )

    if (hasOverlap) {
      toast({
        title: "Time slot overlap",
        description: "This time slot overlaps with an existing one.",
        variant: "destructive",
      })
      return
    }

    setAvailability([...availability, newSlot])
  }

  const handleRemoveTimeSlot = (id: string) => {
    setAvailability(availability.filter((slot) => slot.id !== id))
  }

  const handleSave = async () => {
    setIsSubmitting(true)

    try {
      // Save to localStorage
      const storedUser = localStorage.getItem("linguaConnectUser")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        const userId = userData.id || userData.email
        localStorage.setItem(`availability_${userId}`, JSON.stringify(availability))

        // Save calendar integrations
        localStorage.setItem(`calendar_integrations_${userId}`, JSON.stringify(integrations))

        // Update user data to include availability
        userData.hasSetAvailability = true
        localStorage.setItem("linguaConnectUser", JSON.stringify(userData))
      }

      // Call the onSave callback
      onSave(availability)

      toast({
        title: "Availability saved",
        description: "Your availability has been updated successfully.",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving availability:", error)
      toast({
        title: "Error",
        description: "There was a problem saving your availability. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConnectCalendar = (type: "google" | "outlook" | "apple" | "calendly") => {
    // In a real app, this would redirect to OAuth flow
    // For demo purposes, we'll simulate a successful connection
    setIntegrations(
      integrations.map((integration) =>
        integration.type === type
          ? { ...integration, connected: true, lastSync: new Date().toISOString() }
          : integration,
      ),
    )

    toast({
      title: "Calendar connected",
      description: `Your ${type} calendar has been connected successfully.`,
    })

    // Simulate importing some availability from the calendar
    if (availability.length === 0) {
      const mockAvailability: TimeSlot[] = [
        {
          id: "Monday-09:00-11:00",
          day: "Monday",
          startTime: "09:00",
          endTime: "11:00",
        },
        {
          id: "Wednesday-13:00-15:00",
          day: "Wednesday",
          startTime: "13:00",
          endTime: "15:00",
        },
        {
          id: "Friday-14:00-16:00",
          day: "Friday",
          startTime: "14:00",
          endTime: "16:00",
        },
      ]
      setAvailability(mockAvailability)
    }
  }

  const handleDisconnectCalendar = (type: "google" | "outlook" | "apple" | "calendly") => {
    setIntegrations(
      integrations.map((integration) => (integration.type === type ? { type, connected: false } : integration)),
    )

    toast({
      title: "Calendar disconnected",
      description: `Your ${type} calendar has been disconnected.`,
    })
  }

  const handleImportFromUrl = () => {
    if (!calendarUrl) {
      toast({
        title: "URL required",
        description: "Please enter a calendar URL to import.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    // Simulate importing from URL
    setTimeout(() => {
      // Add some mock availability
      const mockAvailability: TimeSlot[] = [
        {
          id: "Tuesday-10:00-12:00",
          day: "Tuesday",
          startTime: "10:00",
          endTime: "12:00",
        },
        {
          id: "Thursday-15:00-17:00",
          day: "Thursday",
          startTime: "15:00",
          endTime: "17:00",
        },
      ]

      setAvailability([...availability, ...mockAvailability])
      setIsImporting(false)
      setCalendarUrl("")

      toast({
        title: "Calendar imported",
        description: "Your availability has been imported successfully.",
      })
    }, 1500)
  }

  const handleSyncCalendars = () => {
    const connectedCalendars = integrations.filter((i) => i.connected)

    if (connectedCalendars.length === 0) {
      toast({
        title: "No connected calendars",
        description: "Please connect at least one calendar to sync.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Calendars syncing",
      description: "Your calendars are being synchronized...",
    })

    // Simulate sync delay
    setTimeout(() => {
      toast({
        title: "Sync complete",
        description: `Successfully synced ${connectedCalendars.length} calendar(s).`,
      })

      // Update last sync time
      setIntegrations(
        integrations.map((integration) =>
          integration.connected ? { ...integration, lastSync: new Date().toISOString() } : integration,
        ),
      )
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Manage Your Availability</DialogTitle>
          <DialogDescription>
            Define when you're available to teach or sync with your existing calendars.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Manual Setup</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Calendar Sync</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="day">Day</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger id="day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="startTime">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={`start-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="endTime">
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={`end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="button" variant="outline" onClick={handleAddTimeSlot} className="w-full">
              Add Time Slot
            </Button>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Connect Your Calendars</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <div key={integration.type} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-md">
                        {integration.type === "google" && <span className="text-lg">G</span>}
                        {integration.type === "outlook" && <span className="text-lg">O</span>}
                        {integration.type === "apple" && <span className="text-lg">A</span>}
                        {integration.type === "calendly" && <span className="text-lg">C</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{integration.type}</p>
                        {integration.connected && integration.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Last synced: {new Date(integration.lastSync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {integration.connected ? (
                      <Button variant="outline" size="sm" onClick={() => handleDisconnectCalendar(integration.type)}>
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnectCalendar(integration.type)}
                        className="bg-[#8B5A2B] text-white hover:bg-[#8B5A2B]/90"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {integrations.some((i) => i.connected) && (
                <Button onClick={handleSyncCalendars} variant="outline" className="w-full flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Sync All Connected Calendars
                </Button>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Import from Calendar URL</h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Paste iCal URL (ics, webcal://, etc.)"
                      value={calendarUrl}
                      onChange={(e) => setCalendarUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleImportFromUrl}
                    disabled={isImporting || !calendarUrl}
                    className="bg-[#8B5A2B] text-white hover:bg-[#8B5A2B]/90"
                  >
                    {isImporting ? "Importing..." : "Import"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports iCal, Google Calendar, Outlook, and Apple Calendar URLs
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <Label>Your Availability</Label>
            {availability.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAvailability([])}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-7"
              >
                Clear All
              </Button>
            )}
          </div>
          {availability.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No availability set. Add time slots above or import from your calendar.
            </p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
              {DAYS.map((day) => {
                const daySlots = availability.filter((slot) => slot.day === day)
                if (daySlots.length === 0) return null

                return (
                  <div key={day} className="space-y-1">
                    <h4 className="text-sm font-medium">{day}</h4>
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                        <span className="text-sm">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTimeSlot(slot.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Availability"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
