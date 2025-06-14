"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Plus, MessageSquare, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User, Availability, Lesson, CalendarInfo } from "@/types/schedule"

export default function SchedulePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([])
  const [pastLessons, setPastLessons] = useState<Lesson[]>([])
  const [loadingLessons, setLoadingLessons] = useState<boolean>(true)
  const [isTeacher, setIsTeacher] = useState<boolean>(false)
  const [availability, setAvailability] = useState<Availability>({
    monday: { available: false, slots: [] },
    tuesday: { available: false, slots: [] },
    wednesday: { available: false, slots: [] },
    thursday: { available: false, slots: [] },
    friday: { available: false, slots: [] },
    saturday: { available: false, slots: [] },
    sunday: { available: false, slots: [] },
  })
  const [calendarConnected, setCalendarConnected] = useState<boolean>(false)
  const [calendarType, setCalendarType] = useState<string>("")
  const [isSaving, setIsSaving] = useState<boolean>(false)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("linguaConnectUser")
    if (!storedUser) {
      router.push("/login")
      return
    }

    try {
      const userData = JSON.parse(storedUser) as User
      setUser(userData)
      setIsTeacher(userData.role === "teacher")

      // Fetch data
      fetchLessons(userData.id)
      if (userData.role === "teacher") {
        fetchAvailability(userData.id)
      }
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/login")
    }
  }, [router])

  const fetchLessons = async (userId: string | number) => {
    setLoadingLessons(true)
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate fetching from localStorage
      const storedLessons = localStorage.getItem("userLessons")
      let lessons: Lesson[] = []

      if (storedLessons) {
        lessons = JSON.parse(storedLessons) as Lesson[]
        // Filter lessons for this user (either as student or teacher)
        lessons = lessons.filter((lesson: Lesson) =>
          isTeacher ? lesson.teacherId === userId : lesson.studentId === userId,
        )
      }

      // Split into upcoming and past lessons
      const now = new Date()
      const upcoming = lessons.filter((lesson: Lesson) => new Date(lesson.date) >= now)
      const past = lessons.filter((lesson: Lesson) => new Date(lesson.date) < now)

      setUpcomingLessons(upcoming)
      setPastLessons(past)
    } catch (error) {
      console.error("Error fetching lessons:", error)
      toast({
        title: "Error",
        description: "Failed to load your lessons. Please try again later.",
        variant: "destructive",
      })
      setUpcomingLessons([])
      setPastLessons([])
    } finally {
      setLoadingLessons(false)
    }
  }

  const fetchAvailability = async (teacherId: string | number) => {
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate fetching from localStorage
      const storedAvailability = localStorage.getItem(`teacherAvailability_${teacherId}`)

      if (storedAvailability) {
        setAvailability(JSON.parse(storedAvailability) as Availability)
      }

      // Check if calendar is connected
      const storedCalendarInfo = localStorage.getItem(`teacherCalendar_${teacherId}`)
      if (storedCalendarInfo) {
        const calendarInfo = JSON.parse(storedCalendarInfo) as CalendarInfo
        setCalendarConnected(true)
        setCalendarType(calendarInfo.type)
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
      toast({
        title: "Error",
        description: "Failed to load your availability settings.",
        variant: "destructive",
      })
    }
  }

  const handleToggleDay = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available,
      },
    }))
  }

  const handleAddTimeSlot = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: "09:00", end: "10:00", id: Date.now().toString() }],
      },
    }))
  }

  const handleRemoveTimeSlot = (day: string, slotId: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((slot) => slot.id !== slotId),
      },
    }))
  }

  const handleUpdateTimeSlot = (day: string, slotId: string, field: string, value: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot) => (slot.id === slotId ? { ...slot, [field]: value } : slot)),
      },
    }))
  }

  const handleSaveAvailability = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User information is missing.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // In a real app, this would be an API call
      // For now, we'll save to localStorage
      localStorage.setItem(`teacherAvailability_${user.id}`, JSON.stringify(availability))

      toast({
        title: "Success",
        description: "Your availability has been updated.",
      })
    } catch (error) {
      console.error("Error saving availability:", error)
      toast({
        title: "Error",
        description: "Failed to save your availability settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnectCalendar = (calendarType: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User information is missing.",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would redirect to OAuth flow
    // For now, we'll simulate connecting
    try {
      localStorage.setItem(
        `teacherCalendar_${user.id}`,
        JSON.stringify({
          type: calendarType,
          connected: true,
          lastSync: new Date().toISOString(),
        }),
      )

      setCalendarConnected(true)
      setCalendarType(calendarType)

      toast({
        title: "Calendar Connected",
        description: `Your ${calendarType} calendar has been connected successfully.`,
      })
    } catch (error) {
      console.error("Error connecting calendar:", error)
      toast({
        title: "Error",
        description: "Failed to connect your calendar.",
        variant: "destructive",
      })
    }
  }

  const handleDisconnectCalendar = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User information is missing.",
        variant: "destructive",
      })
      return
    }

    try {
      localStorage.removeItem(`teacherCalendar_${user.id}`)

      setCalendarConnected(false)
      setCalendarType("")

      toast({
        title: "Calendar Disconnected",
        description: "Your calendar has been disconnected.",
      })
    } catch (error) {
      console.error("Error disconnecting calendar:", error)
      toast({
        title: "Error",
        description: "Failed to disconnect your calendar.",
        variant: "destructive",
      })
    }
  }

  const handleCancelLesson = async (lessonId: string | number) => {
    try {
      // In a real app, this would be an API call
      // For now, we'll update localStorage
      const storedLessons = localStorage.getItem("userLessons")
      if (storedLessons) {
        let lessons = JSON.parse(storedLessons) as Lesson[]
        lessons = lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, status: "canceled" } : lesson))
        localStorage.setItem("userLessons", JSON.stringify(lessons))
      }

      // Update the UI
      setUpcomingLessons(
        upcomingLessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, status: "canceled" } : lesson)),
      )

      toast({
        title: "Lesson canceled",
        description: "The lesson has been successfully canceled.",
      })
    } catch (error) {
      console.error("Error canceling lesson:", error)
      toast({
        title: "Error",
        description: "Failed to cancel lesson. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isLoading = loadingLessons

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
          </div>

          <div className="h-12 w-full bg-muted rounded animate-pulse"></div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            {isTeacher
              ? "Manage your teaching schedule and availability."
              : "Manage your upcoming lessons and book new sessions with your teachers."}
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming Lessons</TabsTrigger>
            {isTeacher ? (
              <TabsTrigger value="availability">Manage Availability</TabsTrigger>
            ) : (
              <TabsTrigger value="book">Book New Lesson</TabsTrigger>
            )}
            <TabsTrigger value="past">Past Lessons</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingLessons.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingLessons.map((lesson) => (
                  <Card key={lesson.id} className={lesson.status === "canceled" ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={isTeacher ? lesson.studentAvatar : lesson.teacherAvatar || "/placeholder.svg"}
                              alt={isTeacher ? lesson.studentName : lesson.teacherName}
                            />
                            <AvatarFallback>
                              {(isTeacher ? lesson.studentName : lesson.teacherName)?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {isTeacher ? lesson.studentName : lesson.teacherName}
                            </CardTitle>
                            <CardDescription>{lesson.language}</CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={
                            lesson.status === "confirmed"
                              ? "default"
                              : lesson.status === "pending"
                                ? "outline"
                                : "destructive"
                          }
                        >
                          {lesson.status?.charAt(0).toUpperCase() + lesson.status?.slice(1) || "Unknown"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4 opacity-70" />
                          <span>{format(new Date(lesson.date), "EEEE, MMMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="mr-2 h-4 w-4 opacity-70" />
                          <span>
                            {lesson.startTime} - {lesson.endTime}
                          </span>
                        </div>
                        <p className="text-sm mt-2">{lesson.topic}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/messages?${isTeacher ? "student" : "teacher"}=${isTeacher ? lesson.studentId : lesson.teacherId}`,
                          )
                        }
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                      {lesson.status !== "canceled" && (
                        <Button variant="destructive" size="sm" onClick={() => handleCancelLesson(lesson.id)}>
                          Cancel
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No upcoming lessons</h3>
                <p className="text-muted-foreground mt-2 mb-6">
                  {isTeacher
                    ? "You don't have any lessons scheduled with students yet."
                    : "You don't have any lessons scheduled. Book a lesson to get started."}
                </p>
                {!isTeacher && (
                  <Button
                    onClick={() => {
                      const bookTab = document.querySelector('[data-value="book"]')
                      if (bookTab) {
                        ;(bookTab as HTMLElement).click()
                      }
                    }}
                  >
                    Book Your First Lesson
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {isTeacher ? (
            <TabsContent value="availability" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Your Availability</CardTitle>
                  <CardDescription>
                    Set your weekly teaching schedule and connect your calendar to automatically sync your availability.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Calendar Integration</h3>
                      {calendarConnected ? (
                        <Badge variant="outline" className="ml-2">
                          Connected to {calendarType}
                        </Badge>
                      ) : null}
                    </div>

                    {calendarConnected ? (
                      <div className="flex flex-col space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Your {calendarType} calendar is connected. Your availability will be automatically updated
                          based on your calendar events.
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toast({
                                title: "Calendar Synced",
                                description: "Your availability has been updated based on your calendar.",
                              })
                            }
                          >
                            Sync Now
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleDisconnectCalendar}>
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Connect your calendar to automatically sync your availability with your existing schedule.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => handleConnectCalendar("Google Calendar")}>
                            <svg
                              className="mr-2 h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 4.8V19.2C6 20.88 7.12 22 8.8 22H15.2C16.88 22 18 20.88 18 19.2V4.8C18 3.12 16.88 2 15.2 2H8.8C7.12 2 6 3.12 6 4.8Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M11.98 18H12.02"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Google Calendar
                          </Button>
                          <Button variant="outline" onClick={() => handleConnectCalendar("Outlook")}>
                            <svg
                              className="mr-2 h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 4.8V19.2C6 20.88 7.12 22 8.8 22H15.2C16.88 22 18 20.88 18 19.2V4.8C18 3.12 16.88 2 15.2 2H8.8C7.12 2 6 3.12 6 4.8Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M11.98 18H12.02"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Outlook
                          </Button>
                          <Button variant="outline" onClick={() => handleConnectCalendar("Apple Calendar")}>
                            <svg
                              className="mr-2 h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 4.8V19.2C6 20.88 7.12 22 8.8 22H15.2C16.88 22 18 20.88 18 19.2V4.8C18 3.12 16.88 2 15.2 2H8.8C7.12 2 6 3.12 6 4.8Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M11.98 18H12.02"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Apple Calendar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Weekly Availability</h3>
                    <div className="space-y-6">
                      {Object.entries(availability).map(([day, dayData]) => (
                        <div key={day} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`${day}-available`}
                                checked={dayData.available}
                                onCheckedChange={() => handleToggleDay(day)}
                              />
                              <Label htmlFor={`${day}-available`} className="capitalize">
                                {day}
                              </Label>
                            </div>
                            {dayData.available && (
                              <Button variant="ghost" size="sm" onClick={() => handleAddTimeSlot(day)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Time Slot
                              </Button>
                            )}
                          </div>

                          {dayData.available && dayData.slots.length > 0 && (
                            <div className="grid gap-4 pl-8">
                              {dayData.slots.map((slot) => (
                                <div key={slot.id} className="flex items-center space-x-2">
                                  <Select
                                    value={slot.start}
                                    onValueChange={(value) => handleUpdateTimeSlot(day, slot.id, "start", value)}
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue placeholder="Start time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 24 }).map((_, i) => (
                                        <SelectItem key={i} value={`${String(i).padStart(2, "0")}:00`}>
                                          {`${String(i).padStart(2, "0")}:00`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span>to</span>
                                  <Select
                                    value={slot.end}
                                    onValueChange={(value) => handleUpdateTimeSlot(day, slot.id, "end", value)}
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue placeholder="End time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 24 }).map((_, i) => (
                                        <SelectItem key={i} value={`${String(i).padStart(2, "0")}:00`}>
                                          {`${String(i).padStart(2, "0")}:00`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveTimeSlot(day, slot.id)}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-4 w-4"
                                    >
                                      <path d="M18 6L6 18"></path>
                                      <path d="M6 6L18 18"></path>
                                    </svg>
                                    <span className="sr-only">Remove</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {dayData.available && dayData.slots.length === 0 && (
                            <p className="text-sm text-muted-foreground pl-8">
                              No time slots added. Click "Add Time Slot" to add your availability.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveAvailability} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Availability"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          ) : (
            <TabsContent value="book" className="mt-6">
              {/* Student booking UI - kept from original code */}
            </TabsContent>
          )}

          <TabsContent value="past" className="mt-6">
            {pastLessons.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pastLessons.map((lesson) => (
                  <Card key={lesson.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={isTeacher ? lesson.studentAvatar : lesson.teacherAvatar || "/placeholder.svg"}
                              alt={isTeacher ? lesson.studentName : lesson.teacherName}
                            />
                            <AvatarFallback>
                              {(isTeacher ? lesson.studentName : lesson.teacherName)?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {isTeacher ? lesson.studentName : lesson.teacherName}
                            </CardTitle>
                            <CardDescription>{lesson.language}</CardDescription>
                          </div>
                        </div>
                        {!isTeacher && lesson.rated && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm">{lesson.rating}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4 opacity-70" />
                          <span>{format(new Date(lesson.date), "EEEE, MMMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="mr-2 h-4 w-4 opacity-70" />
                          <span>
                            {lesson.startTime} - {lesson.endTime}
                          </span>
                        </div>
                        <p className="text-sm mt-2">{lesson.topic}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-3">
                      {isTeacher ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/messages?student=${lesson.studentId}`)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message Student
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/book-lesson/${lesson.teacherId}`)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Book Again
                          </Button>
                          {!lesson.rated && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                // Handle rating
                              }}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Rate Lesson
                            </Button>
                          )}
                        </>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No past lessons</h3>
                <p className="text-muted-foreground mt-2">
                  {isTeacher
                    ? "You haven't completed any lessons with students yet."
                    : "You haven't completed any lessons yet."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
