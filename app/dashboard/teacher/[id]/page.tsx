"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, Clock, Globe, Mail, MessageSquare, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StarRating } from "@/components/star-rating"
import { Skeleton } from "@/components/ui/skeleton"
import { teacherService, reviewService } from "@/lib/api-service"

interface Review {
  id: string | number
  studentName: string
  rating: number
  date: string
  comment: string
  language: string
}

export default function TeacherProfilePage({ params }: { params: { id: string } }) {
  const [teacher, setTeacher] = useState<any>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeacherData = async () => {
      setIsLoading(true)
      try {
        const teacherData = await teacherService.getTeacherById(params.id)
        setTeacher(teacherData)
      } catch (error) {
        console.error("Error fetching teacher:", error)
        setError("Failed to load teacher profile. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchTeacherReviews = async () => {
      setReviewsLoading(true)
      try {
        const data = await reviewService.getTeacherReviews(params.id)
        setReviews(data.reviews || [])
        setAverageRating(data.averageRating || 0)
      } catch (error) {
        console.error("Error fetching reviews:", error)
        setReviews([])
        setAverageRating(0)
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchTeacherData()
    fetchTeacherReviews()
  }, [params.id])

  if (isLoading) {
    return <TeacherProfileSkeleton />
  }

  if (error || !teacher) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/find-teachers"
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to teachers
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">{error || "Teacher not found"}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/find-teachers"
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to teachers
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative h-32 w-32 overflow-hidden rounded-full">
                  <Image
                    src={teacher.profileImage || "/placeholder.svg?height=128&width=128&query=teacher"}
                    alt={teacher.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h1 className="mt-4 text-2xl font-bold">{teacher.name}</h1>
                <p className="text-muted-foreground">{teacher.languages.join(", ")} Teacher</p>
                <div className="mt-2 flex items-center">
                  <StarRating rating={averageRating} />
                  <span className="ml-2">{averageRating.toFixed(1)}</span>
                  <span className="ml-1 text-muted-foreground">({reviews.length})</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{teacher.location}</p>
                <div className="mt-6 w-full">
                  <Button className="w-full bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" asChild>
                    <Link href={`/dashboard/book-lesson/${teacher.id}`}>Book a Lesson</Link>
                  </Button>
                  <Button variant="outline" className="mt-2 w-full" asChild>
                    <Link href={`/dashboard/messages?teacherId=${teacher.id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="about">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold">About Me</h2>
                  <p className="mt-2 text-sm">{teacher.bio}</p>

                  <h3 className="mt-6 text-lg font-semibold">Teaching Style</h3>
                  <p className="mt-2 text-sm">{teacher.teachingStyle}</p>

                  <h3 className="mt-6 text-lg font-semibold">Languages</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {teacher.languages.map((language: string) => (
                      <div key={language} className="flex items-center rounded-full bg-muted px-3 py-1 text-xs">
                        <Globe className="mr-1 h-3 w-3" />
                        {language}
                      </div>
                    ))}
                  </div>

                  <h3 className="mt-6 text-lg font-semibold">Lesson Information</h3>
                  <div className="mt-2 grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start">
                      <Clock className="mr-2 mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Lesson Duration</p>
                        <p className="text-sm text-muted-foreground">30, 45, or 60 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Video className="mr-2 mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Lesson Format</p>
                        <p className="text-sm text-muted-foreground">Video call via Zoom or Skype</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Calendar className="mr-2 mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Availability</p>
                        <p className="text-sm text-muted-foreground">
                          {teacher.availability || "Weekdays and weekends"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="mr-2 mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Response Time</p>
                        <p className="text-sm text-muted-foreground">Usually within 24 hours</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="experience" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold">Experience</h2>
                  <div className="mt-4 space-y-4">
                    {teacher.experience ? (
                      teacher.experience.map((exp: any, index: number) => (
                        <div key={index} className="border-b pb-4 last:border-0">
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          <p className="text-sm text-muted-foreground">{exp.period}</p>
                          <p className="mt-2 text-sm">{exp.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No experience information available.</p>
                    )}
                  </div>

                  <h2 className="mt-6 text-xl font-semibold">Education</h2>
                  <div className="mt-4 space-y-4">
                    {teacher.education ? (
                      teacher.education.map((edu: any, index: number) => (
                        <div key={index} className="border-b pb-4 last:border-0">
                          <p className="font-medium">{edu.degree}</p>
                          <p className="text-sm text-muted-foreground">{edu.institution}</p>
                          <p className="text-sm text-muted-foreground">{edu.period}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No education information available.</p>
                    )}
                  </div>

                  <h2 className="mt-6 text-xl font-semibold">Certifications</h2>
                  <div className="mt-4 space-y-4">
                    {teacher.certifications ? (
                      teacher.certifications.map((cert: any, index: number) => (
                        <div key={index} className="border-b pb-4 last:border-0">
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                          <p className="text-sm text-muted-foreground">{cert.date}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No certification information available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Student Reviews</h2>
                    <div className="flex items-center">
                      <StarRating rating={averageRating} />
                      <span className="ml-2 font-medium">{averageRating.toFixed(1)}</span>
                      <span className="ml-1 text-muted-foreground">({reviews.length})</span>
                    </div>
                  </div>

                  {reviewsLoading ? (
                    <div className="mt-6 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border-b pb-4 last:border-0">
                          <div className="flex justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="mt-2 h-4 w-full" />
                          <Skeleton className="mt-1 h-4 w-full" />
                          <Skeleton className="mt-1 h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="mt-6 space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <div className="flex justify-between">
                            <p className="font-medium">{review.studentName}</p>
                            <p className="text-sm text-muted-foreground">{review.date}</p>
                          </div>
                          <div className="mt-1">
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          <p className="mt-2 text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 text-center py-8">
                      <p className="text-muted-foreground">No reviews yet.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Be the first to leave a review after your lesson!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function TeacherProfileSkeleton() {
  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="mt-4 h-8 w-48" />
                <Skeleton className="mt-2 h-4 w-32" />
                <Skeleton className="mt-2 h-4 w-24" />
                <Skeleton className="mt-2 h-4 w-36" />
                <Skeleton className="mt-6 h-10 w-full" />
                <Skeleton className="mt-2 h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Skeleton className="h-10 w-full" />
          <Card className="mt-6">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-3/4" />

              <Skeleton className="mt-6 h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-full" />

              <Skeleton className="mt-6 h-6 w-32" />
              <div className="mt-2 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>

              <Skeleton className="mt-6 h-6 w-48" />
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
