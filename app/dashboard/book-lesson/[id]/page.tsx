"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, CreditCard, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

// Define interfaces for our data structures
interface TeacherAvailability {
  day: string
  slots: string[]
}

interface TeacherDiscounts {
  monthly4: number
  monthly8: number
  monthly12: number
}

interface Teacher {
  id: number
  name: string
  language: string
  rating: number
  reviews: number
  hourlyRate: number
  availability: TeacherAvailability[]
  bio: string
  image: string
  discounts: TeacherDiscounts
  trialClassAvailable: boolean
  trialClassPrice: number
}

interface AvailableDate {
  date: string
  day: string
}

interface PriceCalculation {
  original: number
  discounted: number
  discount: number
  total: number
}

// Mock data for teachers (same as in find-teachers page)
const mockTeachers: Teacher[] = [
  {
    id: 1,
    name: "Maria Garcia",
    language: "spanish",
    rating: 4.9,
    reviews: 124,
    hourlyRate: 25,
    availability: [
      { day: "Monday", slots: ["9:00 - 11:00", "14:00 - 16:00"] },
      { day: "Wednesday", slots: ["10:00 - 12:00", "15:00 - 17:00"] },
      { day: "Friday", slots: ["9:00 - 11:00", "13:00 - 15:00"] },
    ],
    bio: "Native Spanish speaker with 5 years of teaching experience. Specialized in conversational Spanish for beginners and intermediate learners.",
    image: "/diverse-classroom.png",
    discounts: {
      monthly4: 10, // 10% discount for 4 classes per month
      monthly8: 15, // 15% discount for 8 classes per month
      monthly12: 20, // 20% discount for 12 classes per month
    },
    trialClassAvailable: true,
    trialClassPrice: 15,
  },
  {
    id: 2,
    name: "Jean Dupont",
    language: "french",
    rating: 4.8,
    reviews: 98,
    hourlyRate: 30,
    availability: [
      { day: "Tuesday", slots: ["8:00 - 10:00", "16:00 - 18:00"] },
      { day: "Thursday", slots: ["9:00 - 11:00", "15:00 - 17:00"] },
      { day: "Saturday", slots: ["10:00 - 13:00"] },
    ],
    bio: "French teacher with a focus on grammar and pronunciation. I help students achieve fluency through structured lessons and practical exercises.",
    image: "/diverse-classroom.png",
    discounts: {
      monthly4: 5, // 5% discount for 4 classes per month
      monthly8: 10, // 10% discount for 8 classes per month
      monthly12: 15, // 15% discount for 12 classes per month
    },
    trialClassAvailable: true,
    trialClassPrice: 20,
  },
  {
    id: 3,
    name: "Hiroshi Tanaka",
    language: "japanese",
    rating: 4.7,
    reviews: 87,
    hourlyRate: 28,
    availability: [
      { day: "Monday", slots: ["18:00 - 20:00"] },
      { day: "Wednesday", slots: ["18:00 - 20:00"] },
      { day: "Saturday", slots: ["9:00 - 12:00", "14:00 - 16:00"] },
    ],
    bio: "Tokyo native teaching Japanese for 7 years. I specialize in helping students master kanji and natural conversation patterns.",
    image: "/diverse-classroom.png",
    discounts: {
      monthly4: 8, // 8% discount for 4 classes per month
      monthly8: 12, // 12% discount for 8 classes per month
      monthly12: 18, // 18% discount for 12 classes per month
    },
    trialClassAvailable: true,
    trialClassPrice: 18,
  },
  {
    id: 4,
    name: "Anna Schmidt",
    language: "german",
    rating: 4.9,
    reviews: 112,
    hourlyRate: 27,
    availability: [
      { day: "Tuesday", slots: ["10:00 - 12:00", "17:00 - 19:00"] },
      { day: "Thursday", slots: ["10:00 - 12:00", "17:00 - 19:00"] },
      { day: "Sunday", slots: ["14:00 - 17:00"] },
    ],
    bio: "German language instructor with a background in linguistics. My teaching approach focuses on practical communication skills and cultural context.",
    image: "/diverse-classroom.png",
    discounts: {
      monthly4: 7, // 7% discount for 4 classes per month
      monthly8: 12, // 12% discount for 8 classes per month
      monthly12: 18, // 18% discount for 12 classes per month
    },
    trialClassAvailable: true,
    trialClassPrice: 17,
  },
  {
    id: 5,
    name: "Li Wei",
    language: "mandarin",
    rating: 4.8,
    reviews: 76,
    hourlyRate: 26,
    availability: [
      { day: "Monday", slots: ["8:00 - 10:00", "19:00 - 21:00"] },
      { day: "Wednesday", slots: ["8:00 - 10:00", "19:00 - 21:00"] },
      { day: "Friday", slots: ["19:00 - 21:00"] },
    ],
    bio: "Mandarin teacher from Beijing with 6 years of experience. I help students master tones and characters through interactive lessons.",
    image: "/diverse-classroom.png",
    discounts: {
      monthly4: 5, // 5% discount for 4 classes per month
      monthly8: 10, // 10% discount for 8 classes per month
      monthly12: 15, // 15% discount for 12 classes per month
    },
    trialClassAvailable: true,
    trialClassPrice: 16,
  },
  {
    id: 6,
    name: "Sofia Rossi",
    language: "italian",
    rating: 4.7,
    reviews: 92,
    hourlyRate: 24,
    availability: [
      { day: "Tuesday", slots: ["9:00 - 11:00", "15:00 - 17:00"] },
      { day: "Thursday", slots: ["9:00 - 11:00", "15:00 - 17:00"] },
      { day: "Saturday", slots: ["11:00 - 14:00"] },
    ],
    bio: "Italian language enthusiast from Florence. My lessons combine grammar, vocabulary, and cultural insights to provide a comprehensive learning experience.",
    image: "/diverse-classroom.png",
    discounts: {
      monthly4: 8, // 8% discount for 4 classes per month
      monthly8: 15, // 15% discount for 8 classes per month
      monthly12: 20, // 20% discount for 12 classes per month
    },
    trialClassAvailable: true,
    trialClassPrice: 15,
  },
]

// Get next 14 days for date selection
const getNextTwoWeeks = (): AvailableDate[] => {
  const dates: AvailableDate[] = []
  const today = new Date()

  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    // Get day name
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" })

    // Format date
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    dates.push({
      date: formattedDate,
      day: dayName,
    })
  }

  return dates
}

interface BookLessonPageProps {
  params: {
    id: string
  }
}

export default function BookLessonPage({ params }: BookLessonPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [bookingType, setBookingType] = useState<"single" | "monthly" | "trial">("single")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [lessonDuration, setLessonDuration] = useState<string>("60")
  const [lessonFocus, setLessonFocus] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [step, setStep] = useState<number>(1)
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])

  // Monthly subscription options
  const [classesPerMonth, setClassesPerMonth] = useState<string>("4")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>("")
  const [subscriptionDuration, setSubscriptionDuration] = useState<string>("3") // in months

  // Calculate total and discounted prices
  const calculatePrice = (): PriceCalculation => {
    if (!teacher) return { original: 0, discounted: 0, discount: 0, total: 0 }

    if (bookingType === "trial" && teacher.trialClassAvailable) {
      return {
        original: teacher.trialClassPrice,
        discounted: teacher.trialClassPrice,
        discount: 0,
        total: teacher.trialClassPrice,
      }
    }

    if (bookingType === "single") {
      const basePrice = (teacher.hourlyRate * Number.parseInt(lessonDuration)) / 60
      return {
        original: basePrice,
        discounted: basePrice,
        discount: 0,
        total: basePrice,
      }
    }

    if (bookingType === "monthly") {
      const classesCount = Number.parseInt(classesPerMonth)
      const months = Number.parseInt(subscriptionDuration)
      const basePrice = teacher.hourlyRate * classesCount * months

      let discountPercent = 0
      if (classesCount === 4) discountPercent = teacher.discounts.monthly4
      else if (classesCount === 8) discountPercent = teacher.discounts.monthly8
      else if (classesCount === 12) discountPercent = teacher.discounts.monthly12

      const discountAmount = basePrice * (discountPercent / 100)
      const discountedPrice = basePrice - discountAmount

      return {
        original: basePrice,
        discounted: discountedPrice,
        discount: discountPercent,
        total: discountedPrice,
      }
    }

    return { original: 0, discounted: 0, discount: 0, total: 0 }
  }

  useEffect(() => {
    // In a real app, this would be an API call
    const teacherId = Number.parseInt(params.id)
    const foundTeacher = mockTeachers.find((t) => t.id === teacherId)

    if (foundTeacher) {
      setTeacher(foundTeacher)

      // Get available dates based on teacher's availability
      const dates = getNextTwoWeeks()
      const availableDays = foundTeacher.availability.map((a) => a.day)

      const filteredDates = dates.filter((d) => availableDays.includes(d.day))

      setAvailableDates(filteredDates)
    } else {
      // Handle teacher not found
      toast({
        title: "Teacher not found",
        description: "The teacher you're looking for doesn't exist.",
        variant: "destructive",
      })
      router.push("/dashboard/find-teachers")
    }

    setLoading(false)
  }, [params.id, router, toast])

  useEffect(() => {
    // Update available time slots when date changes
    if (selectedDate && teacher) {
      const selectedDay = new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" })
      const dayAvailability = teacher.availability.find((a) => a.day === selectedDay)

      if (dayAvailability) {
        setAvailableTimeSlots(dayAvailability.slots)
      } else {
        setAvailableTimeSlots([])
      }
    }
  }, [selectedDate, teacher])

  const handleBookLesson = async () => {
    // Validate form based on booking type
    if (bookingType === "single") {
      if (!selectedDate || !selectedTimeSlot || !lessonDuration || !lessonFocus) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }
    } else if (bookingType === "monthly") {
      if (selectedDays.length === 0 || !preferredTimeSlot || !lessonFocus) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      if (selectedDays.length > Number.parseInt(classesPerMonth)) {
        toast({
          title: "Too many days selected",
          description: `You've selected ${selectedDays.length} days but your plan includes only ${classesPerMonth} classes per month.`,
          variant: "destructive",
        })
        return
      }
    } else if (bookingType === "trial") {
      if (!selectedDate || !selectedTimeSlot) {
        toast({
          title: "Missing information",
          description: "Please select a date and time for your trial lesson.",
          variant: "destructive",
        })
        return
      }
    }

    if (!teacher) {
      toast({
        title: "Error",
        description: "Teacher information is missing.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a checkout session
      const price = calculatePrice()
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacher.id,
          lessonType: bookingType,
          lessonDate: selectedDate ? `${selectedDate} ${selectedTimeSlot}` : undefined,
          lessonDuration: bookingType === "single" ? lessonDuration : classesPerMonth,
          amount: price.total,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create checkout session")
      }

      const { checkoutUrl } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error("Error creating checkout session:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your booking",
        variant: "destructive",
      })
    }
  }

  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day))
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }

  if (loading) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading booking page...</p>
        </div>
      </div>
    )
  }

  if (!teacher) {
    return null
  }

  const price = calculatePrice()

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <Link
          href={`/dashboard/teacher/${teacher.id}`}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to teacher profile
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Book with {teacher.name}</h1>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Booking steps sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? "bg-[#8B5A2B] text-white" : "border border-muted-foreground text-muted-foreground"}`}
                    >
                      {step > 1 ? <Check className="h-4 w-4" /> : "1"}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Booking Type</p>
                      <p className="text-sm text-muted-foreground">Choose how you want to book</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? "bg-[#8B5A2B] text-white" : "border border-muted-foreground text-muted-foreground"}`}
                    >
                      {step > 2 ? <Check className="h-4 w-4" /> : "2"}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Schedule</p>
                      <p className="text-sm text-muted-foreground">Choose when you want to learn</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? "bg-[#8B5A2B] text-white" : "border border-muted-foreground text-muted-foreground"}`}
                    >
                      {step > 3 ? <Check className="h-4 w-4" /> : "3"}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Lesson Details</p>
                      <p className="text-sm text-muted-foreground">Specify your learning goals</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 4 ? "bg-[#8B5A2B] text-white" : "border border-muted-foreground text-muted-foreground"}`}
                    >
                      {step > 4 ? <Check className="h-4 w-4" /> : "4"}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Review & Confirm</p>
                      <p className="text-sm text-muted-foreground">Finalize your booking</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Lesson rate</span>
                      <span className="font-medium">${teacher.hourlyRate}/hour</span>
                    </div>

                    {bookingType === "trial" && (
                      <div className="flex justify-between">
                        <span className="text-sm">Trial class</span>
                        <span className="font-medium">${teacher.trialClassPrice}</span>
                      </div>
                    )}

                    {bookingType === "single" && lessonDuration && (
                      <div className="flex justify-between">
                        <span className="text-sm">Duration</span>
                        <span className="font-medium">{lessonDuration} minutes</span>
                      </div>
                    )}

                    {bookingType === "monthly" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm">Classes per month</span>
                          <span className="font-medium">{classesPerMonth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Subscription duration</span>
                          <span className="font-medium">{subscriptionDuration} months</span>
                        </div>
                        {price.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="text-sm">Discount</span>
                            <span className="font-medium">{price.discount}% off</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total</span>
                      {price.discount > 0 ? (
                        <div className="text-right">
                          <span className="line-through text-sm text-muted-foreground">
                            ${price.original.toFixed(2)}
                          </span>
                          <span className="ml-2">${price.total.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span>${price.total.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main booking form */}
          <div className="md:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Choose Booking Type</CardTitle>
                  <CardDescription>Select how you want to book lessons with {teacher.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={bookingType}
                    onValueChange={(value) => setBookingType(value as "single" | "monthly" | "trial")}
                    className="flex flex-col space-y-3"
                  >
                    <div className="flex items-center justify-between rounded-md border p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="booking-single" />
                        <Label htmlFor="booking-single" className="font-medium">
                          Single Lesson
                        </Label>
                      </div>
                      <div className="text-sm text-muted-foreground">Book one lesson at a time</div>
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="booking-monthly" />
                        <Label htmlFor="booking-monthly" className="font-medium">
                          Monthly Subscription
                        </Label>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Save up to{" "}
                        {Math.max(teacher.discounts.monthly4, teacher.discounts.monthly8, teacher.discounts.monthly12)}%
                        with regular lessons
                      </div>
                    </div>

                    {teacher.trialClassAvailable && (
                      <div className="flex items-center justify-between rounded-md border p-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="trial" id="booking-trial" />
                          <Label htmlFor="booking-trial" className="font-medium">
                            Trial Lesson
                          </Label>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Try a discounted 30-minute lesson for ${teacher.trialClassPrice}
                        </div>
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={() => setStep(2)}>
                    Continue
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Schedule Your {bookingType === "trial" ? "Trial" : bookingType === "monthly" ? "Monthly" : ""}{" "}
                    Lessons
                  </CardTitle>
                  <CardDescription>
                    {bookingType === "single" && "Choose when you want to have your lesson"}
                    {bookingType === "monthly" && "Set up your recurring lesson schedule"}
                    {bookingType === "trial" && "Choose when you want to have your trial lesson"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(bookingType === "single" || bookingType === "trial") && (
                    <>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Select value={selectedDate} onValueChange={setSelectedDate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a date" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDates.map((date, index) => (
                              <SelectItem key={index} value={date.date}>
                                {date.day}, {date.date}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Time Slot</Label>
                        <Select
                          value={selectedTimeSlot}
                          onValueChange={setSelectedTimeSlot}
                          disabled={!selectedDate || availableTimeSlots.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !selectedDate
                                  ? "Select a date first"
                                  : availableTimeSlots.length === 0
                                    ? "No available time slots"
                                    : "Select a time slot"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimeSlots.map((slot, index) => (
                              <SelectItem key={index} value={slot}>
                                {slot}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {bookingType === "single" && (
                        <div className="space-y-2">
                          <Label>Lesson Duration</Label>
                          <RadioGroup
                            value={lessonDuration}
                            onValueChange={setLessonDuration}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center justify-between rounded-md border p-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="30" id="duration-30" />
                                <Label htmlFor="duration-30" className="font-normal">
                                  30 minutes
                                </Label>
                              </div>
                              <span className="font-medium">${(teacher.hourlyRate * 0.5).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border p-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="60" id="duration-60" />
                                <Label htmlFor="duration-60" className="font-normal">
                                  60 minutes
                                </Label>
                              </div>
                              <span className="font-medium">${teacher.hourlyRate.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border p-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="90" id="duration-90" />
                                <Label htmlFor="duration-90" className="font-normal">
                                  90 minutes
                                </Label>
                              </div>
                              <span className="font-medium">${(teacher.hourlyRate * 1.5).toFixed(2)}</span>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </>
                  )}

                  {bookingType === "monthly" && (
                    <>
                      <div className="space-y-2">
                        <Label>Classes per month</Label>
                        <RadioGroup
                          value={classesPerMonth}
                          onValueChange={setClassesPerMonth}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center justify-between rounded-md border p-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="4" id="classes-4" />
                              <Label htmlFor="classes-4" className="font-normal">
                                4 classes per month (1 per week)
                              </Label>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-green-600">{teacher.discounts.monthly4}% off</div>
                              <div className="font-medium">
                                ${(teacher.hourlyRate * 4 * (1 - teacher.discounts.monthly4 / 100)).toFixed(2)}/month
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between rounded-md border p-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="8" id="classes-8" />
                              <Label htmlFor="classes-8" className="font-normal">
                                8 classes per month (2 per week)
                              </Label>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-green-600">{teacher.discounts.monthly8}% off</div>
                              <div className="font-medium">
                                ${(teacher.hourlyRate * 8 * (1 - teacher.discounts.monthly8 / 100)).toFixed(2)}/month
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between rounded-md border p-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="12" id="classes-12" />
                              <Label htmlFor="classes-12" className="font-normal">
                                12 classes per month (3 per week)
                              </Label>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-green-600">{teacher.discounts.monthly12}% off</div>
                              <div className="font-medium">
                                ${(teacher.hourlyRate * 12 * (1 - teacher.discounts.monthly12 / 100)).toFixed(2)}/month
                              </div>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label>Subscription duration</Label>
                        <Select value={subscriptionDuration} onValueChange={setSubscriptionDuration}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 month</SelectItem>
                            <SelectItem value="3">3 months</SelectItem>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Preferred days</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Select up to {classesPerMonth} days when you'd like to have your lessons each month
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {teacher.availability.map((slot, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <Checkbox
                                id={`day-${slot.day}`}
                                checked={selectedDays.includes(slot.day)}
                                onCheckedChange={() => handleDayToggle(slot.day)}
                                className="mb-1"
                              />
                              <Label htmlFor={`day-${slot.day}`} className="text-xs">
                                {slot.day.substring(0, 3)}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {selectedDays.length > Number.parseInt(classesPerMonth) && (
                          <p className="text-sm text-red-500">
                            You've selected {selectedDays.length} days but your plan includes only {classesPerMonth}{" "}
                            classes per month.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred time slot</Label>
                        <Select value={preferredTimeSlot} onValueChange={setPreferredTimeSlot}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time slot" />
                          </SelectTrigger>
                          <SelectContent>
                            {teacher.availability.flatMap((day, dayIndex) =>
                              day.slots.map((slot, slotIndex) => (
                                <SelectItem key={`${dayIndex}-${slotIndex}`} value={slot}>
                                  {slot}
                                </SelectItem>
                              )),
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          We'll try to schedule your lessons at this time, but it may vary based on availability.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
                    onClick={() => setStep(3)}
                    disabled={
                      (bookingType === "single" && (!selectedDate || !selectedTimeSlot || !lessonDuration)) ||
                      (bookingType === "monthly" && (selectedDays.length === 0 || !preferredTimeSlot)) ||
                      (bookingType === "trial" && (!selectedDate || !selectedTimeSlot))
                    }
                  >
                    Continue
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Details</CardTitle>
                  <CardDescription>Tell your teacher about your learning goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>What would you like to focus on?</Label>
                    <Select value={lessonFocus} onValueChange={setLessonFocus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a focus area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversation">Conversation Practice</SelectItem>
                        <SelectItem value="grammar">Grammar</SelectItem>
                        <SelectItem value="vocabulary">Vocabulary Building</SelectItem>
                        <SelectItem value="pronunciation">Pronunciation</SelectItem>
                        <SelectItem value="reading">Reading Comprehension</SelectItem>
                        <SelectItem value="writing">Writing Skills</SelectItem>
                        <SelectItem value="exam">Exam Preparation</SelectItem>
                        <SelectItem value="business">Business Language</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Additional notes for your teacher (optional)</Label>
                    <Textarea
                      placeholder="Share any specific topics, questions, or materials you'd like to cover in your lesson"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
                    onClick={() => setStep(4)}
                    disabled={!lessonFocus}
                  >
                    Continue
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review & Confirm</CardTitle>
                  <CardDescription>Confirm your booking details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-md border p-4 space-y-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Booking Type</p>
                        <p className="text-sm text-muted-foreground">
                          {bookingType === "single" && "Single Lesson"}
                          {bookingType === "monthly" &&
                            `Monthly Subscription (${classesPerMonth} classes/month for ${subscriptionDuration} months)`}
                          {bookingType === "trial" && "Trial Lesson"}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                        Edit
                      </Button>
                    </div>

                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Schedule</p>
                        {(bookingType === "single" || bookingType === "trial") && (
                          <p className="text-sm text-muted-foreground">
                            {selectedDate}, {selectedTimeSlot}
                          </p>
                        )}
                        {bookingType === "monthly" && (
                          <div className="text-sm text-muted-foreground">
                            <p>Days: {selectedDays.join(", ")}</p>
                            <p>Preferred time: {preferredTimeSlot}</p>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                        Edit
                      </Button>
                    </div>

                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Lesson Details</p>
                        <p className="text-sm text-muted-foreground">
                          {bookingType === "single" && `${lessonDuration} minutes, `}Focus:{" "}
                          {lessonFocus.charAt(0).toUpperCase() + lessonFocus.slice(1)}
                        </p>
                        {notes && <p className="text-sm text-muted-foreground mt-1">Notes: {notes}</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                        <p>Payment Method</p>
                      </div>
                      <p className="text-sm">Credit Card ending in 1234</p>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted p-4">
                    <p className="text-sm">
                      By booking this {bookingType === "monthly" ? "subscription" : "lesson"}, you agree to our Terms of
                      Service and Cancellation Policy.
                      {bookingType === "monthly"
                        ? " You can cancel your subscription at any time, but no refunds will be issued for the current billing period."
                        : " You can cancel or reschedule this lesson up to 24 hours before the scheduled time."}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={handleBookLesson}>
                    Confirm Booking
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
