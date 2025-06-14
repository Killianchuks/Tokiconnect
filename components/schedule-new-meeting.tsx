"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Define the Teacher interface
interface Teacher {
  id: string | number
  name: string
  avatar?: string
  languages?: string[]
  hourlyRate?: number
  rating?: number
  availability?: any
}

export function ScheduleNewMeeting({ teacher }: { teacher: Teacher }) {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState("9:00 AM")
  const [topic, setTopic] = useState("")

  const handleSubmit = async () => {
    // In a real app, this would create a new lesson
    toast({
      title: "Lesson Scheduled",
      description: `You have scheduled a lesson with ${teacher.name} on ${selectedDate.toLocaleDateString()} at ${selectedTime} to discuss ${topic}.`,
    })
  }

  // Handle date selection properly
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule New Meeting</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} className="rounded-md border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger>
              <SelectValue placeholder="Select a time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9:00 AM">9:00 AM</SelectItem>
              <SelectItem value="10:00 AM">10:00 AM</SelectItem>
              <SelectItem value="11:00 AM">11:00 AM</SelectItem>
              <SelectItem value="12:00 PM">12:00 PM</SelectItem>
              <SelectItem value="1:00 PM">1:00 PM</SelectItem>
              <SelectItem value="2:00 PM">2:00 PM</SelectItem>
              <SelectItem value="3:00 PM">3:00 PM</SelectItem>
              <SelectItem value="4:00 PM">4:00 PM</SelectItem>
              <SelectItem value="5:00 PM">5:00 PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            placeholder="What would you like to discuss?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <Button className="w-full bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={handleSubmit}>
          Schedule Lesson
        </Button>
      </CardContent>
    </Card>
  )
}
