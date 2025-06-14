"use client"

import { CardFooter } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { useEffect, useState } from "react"

// Update the Teacher interface to include the availability property
interface Teacher {
  id: string
  name: string
  avatar: string
  languages: string[]
  rating: number
  hourlyRate: number
  availability: Array<{
    day: string
    // Add any other properties that might be in the availability objects
  }>
}

interface PairedTeachersListProps {
  onBookLesson: (teacherId: string) => void
  onMessageTeacher: (teacherId: string) => void
}

export function PairedTeachersList({ onBookLesson, onMessageTeacher }: PairedTeachersListProps) {
  // Update the useState initialization with proper typing
  const [teachers, setTeachers] = useState<Teacher[]>([])

  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll simulate fetching from localStorage
    const storedTeachers = localStorage.getItem("pairedTeachers")
    if (storedTeachers) {
      setTeachers(JSON.parse(storedTeachers))
    }
  }, [])

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {teachers.map((teacher: Teacher) => (
        <Card key={teacher.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={teacher.avatar || "/placeholder.svg"} alt={teacher.name} />
                <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{teacher.name}</CardTitle>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-sm">{teacher.rating}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {teacher.languages.map((language: string) => (
                  <Badge key={language} variant="secondary">
                    {language}
                  </Badge>
                ))}
              </div>
              <p className="text-sm font-medium">${teacher.hourlyRate}/hour</p>
              <div className="text-sm text-muted-foreground mt-2">
                <p className="font-medium">Available on:</p>
                <ul className="mt-1">
                  {teacher.availability.map((avail: { day: string }) => (
                    <li key={avail.day}>{avail.day}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-3">
            <Button variant="outline" size="sm" onClick={() => onMessageTeacher(teacher.id)}>
              Message
            </Button>
            <Button variant="default" size="sm" onClick={() => onBookLesson(teacher.id)}>
              Book Lesson
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
