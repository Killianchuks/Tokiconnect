// app/dashboard/book-lesson/[id]/page.tsx
"use client"

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import { ArrowLeft, Check, CreditCard, Info, Loader2, AlertCircle, Wallet, BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { teacherService, authService } from "@/lib/api-service";
import { Teacher, TeacherAvailability, TeacherDiscounts } from "@/lib/api-service";

interface AvailableDate {
  date: string;
  day: string; // E.g., "Monday"
}

interface PriceCalculation {
  original: number;
  discounted: number;
  discount: number;
  total: number;
}

const getNextTwoWeeks = (): AvailableDate[] => {
  const dates: AvailableDate[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    dates.push({
      date: formattedDate,
      day: dayName,
    });
  }
  return dates;
};

export default function BookLessonPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [bookingType, setBookingType] = useState<"single" | "monthly" | "trial" | "free-demo">("single");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [lessonDuration, setLessonDuration] = useState<string>("60"); // State holds duration as string
  const [lessonFocus, setLessonFocus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [step, setStep] = useState<number>(1);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  const [classesPerMonth, setClassesPerMonth] = useState<string>("4");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>("");
  const [subscriptionDuration, setSubscriptionDuration] = useState<string>("3");
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [selectedLessonType, setSelectedLessonType] = useState<string | undefined>(undefined);

  const defaultLessonTypeFromUrl = useSearchParams().get('defaultType');

  const calculatePrice = useCallback((): PriceCalculation => {
    if (!teacher) return { original: 0, discounted: 0, discount: 0, total: 0 };

    const actualDiscounts = teacher.discounts || { monthly4: 0, monthly8: 0, monthly12: 0 };
    const actualTrialPrice = teacher.trialClassPrice ?? 0;
    const actualHourlyRate = teacher.hourlyRate || 0;
    const actualFreeDemoDuration = teacher.freeDemoDuration ?? 30;

    if (bookingType === "free-demo" && teacher.freeDemoAvailable) {
      return {
        original: 0,
        discounted: 0,
        discount: 100,
        total: 0,
      };
    }

    if (bookingType === "trial" && teacher.trialClassAvailable) {
      return {
        original: actualTrialPrice,
        discounted: actualTrialPrice,
        discount: 0,
        total: actualTrialPrice,
      };
    }

    if (bookingType === "single") {
      const basePrice = (actualHourlyRate * Number.parseInt(lessonDuration)) / 60;
      return {
        original: basePrice,
        discounted: basePrice,
        discount: 0,
        total: basePrice,
      };
    }

    if (bookingType === "monthly") {
      const classesCount = Number.parseInt(classesPerMonth);
      const months = Number.parseInt(subscriptionDuration);
      const basePrice = actualHourlyRate * classesCount * months;

      let discountPercent = 0;
      if (classesCount === 4) discountPercent = actualDiscounts.monthly4;
      else if (classesCount === 8) discountPercent = actualDiscounts.monthly8;
      else if (classesCount === 12) discountPercent = actualDiscounts.monthly12;

      const discountAmount = basePrice * (discountPercent / 100);
      const discountedPrice = basePrice - discountAmount;

      return {
        original: basePrice,
        discounted: discountedPrice,
        discount: discountPercent,
        total: discountedPrice,
      };
    }

    return { original: 0, discounted: 0, discount: 0, total: 0 };
  }, [bookingType, classesPerMonth, lessonDuration, subscriptionDuration, teacher]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setFetchError(null);

      const teacherId = Array.isArray(params.id) ? params.id[0] : params.id;

      if (!teacherId || typeof teacherId !== 'string' || teacherId.trim().length === 0) {
        console.warn(`[BookLessonPage CLIENT] Skipping fetch: Teacher ID is invalid. Current value: "${teacherId}"`);
        setFetchError("Invalid teacher ID provided in the URL.");
        setLoading(false);
        router.push("/dashboard/find-teachers");
        return;
      }

      try {
        console.log(`[BookLessonPage CLIENT] Fetching current user...`);
        const user = await authService.getCurrentUser();
        console.log("[BookLessonPage CLIENT] Current User fetched:", user);
        if (!user || user.role !== 'student') {
          router.push('/login');
          return;
        }
        setCurrentUser(user);

        console.log(`[BookLessonPage CLIENT] Calling teacherService.getTeacherById with ID: "${teacherId}"`);
        const fetchedTeacher = await teacherService.getTeacherById(teacherId);

        if (fetchedTeacher) {
          setTeacher(fetchedTeacher);
          console.log("[BookLessonPage CLIENT] Teacher data fetched successfully:", fetchedTeacher);

          const dates = getNextTwoWeeks();
          const availableDays = (fetchedTeacher.availability || []).map((a) => a.day);
          const filteredDates = dates.filter((d) => availableDays.includes(d.day));
          setAvailableDates(filteredDates);

          if (defaultLessonTypeFromUrl) {
            setSelectedLessonType(defaultLessonTypeFromUrl);
          } else if (fetchedTeacher.freeDemoAvailable) {
            setBookingType("free-demo");
            setLessonDuration((fetchedTeacher.freeDemoDuration ?? 30).toString());
          } else if (fetchedTeacher.trialClassAvailable) {
            setBookingType("trial");
            setLessonDuration("30");
          } else {
            setBookingType("single");
            setLessonDuration("60");
          }
        } else {
          console.log("[BookLessonPage CLIENT] teacherService.getTeacherById returned null/undefined.");
          setFetchError("Teacher not found. Please check the URL or try another teacher.");
          toast({
            title: "Teacher not found",
            description: "The teacher you're looking for doesn't exist.",
            variant: "destructive",
          });
          router.push("/dashboard/find-teachers");
        }
      } catch (error) {
        console.error("[BookLessonPage CLIENT] Error fetching data:", error);
        setFetchError("Failed to load page data. " + (error instanceof Error ? error.message : "An unknown error occurred."));
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load page details. Please try again later.",
          variant: "destructive",
        });
        router.push("/dashboard/find-teachers");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [params.id, router, toast, defaultLessonTypeFromUrl]);

  useEffect(() => {
    if (selectedDate && teacher) {
      const selectedDay = new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" });
      const dayAvailability = (teacher.availability || []).find((a) => a.day === selectedDay);

      if (dayAvailability) {
        setAvailableTimeSlots(dayAvailability.slots);
      } else {
        setAvailableTimeSlots([]);
      }
      setSelectedTimeSlot(""); // Reset selected time slot when date changes
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedDate, teacher]);


  const handleBookLesson = async () => {
    console.log("[handleBookLesson] Initiating booking process...");
    console.log("[handleBookLesson] Current Teacher state:", teacher);
    console.log("[handleBookLesson] Current User state:", currentUser);

    // Validate form based on booking type
    if (bookingType === "single") {
      if (!selectedDate || !selectedTimeSlot || !lessonDuration || !lessonFocus) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    } else if (bookingType === "monthly") {
      if (selectedDays.length === 0 || !preferredTimeSlot || !lessonFocus) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      if (selectedDays.length > Number.parseInt(classesPerMonth)) {
        toast({
          title: "Too many days selected",
          description: `You've selected ${selectedDays.length} days but your plan includes only ${classesPerMonth} classes per month.`,
          variant: "destructive",
        });
        return;
      }
    } else if (bookingType === "trial") {
      if (!selectedDate || !selectedTimeSlot) {
        toast({
          title: "Missing information",
          description: "Please select a date and time for your trial lesson.",
          variant: "destructive",
        });
        return;
      }
    } else if (bookingType === "free-demo") {
      if (!selectedDate || !selectedTimeSlot) {
        toast({
          title: "Missing information",
          description: "Please select a date and time for your free demo lesson.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!teacher || !currentUser) {
      toast({
        title: "Error",
        description: "Teacher or user information is missing. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    if (bookingDateTime < new Date()) {
        toast({
            title: "Invalid Time",
            description: "You cannot book a lesson in the past. Please select a future date and time.",
            variant: "destructive",
        });
        return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      const price = calculatePrice();
      const lessonDurationNum = Number.parseInt(lessonDuration);
      const amountToSend = (bookingType === "free-demo" && teacher.freeDemoAvailable) ? 0 : price.total;

      if (bookingType === "free-demo" && teacher.freeDemoAvailable) {
        console.log("[BookLessonPage CLIENT] Attempting to book FREE demo lesson directly...");
        const freeBookingPayload = {
          teacherId: teacher.id,
          studentId: currentUser.id,
          lessonType: "free-demo",
          lessonDate: bookingDateTime.toISOString(),
          lessonDuration: teacher.freeDemoDuration ?? 30,
          amount: 0,
          currency: 'USD',
          notes: notes,
          lessonFocus: lessonFocus,
        };

        const bookingResponse = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(freeBookingPayload),
        });

        const bookingData = await bookingResponse.json();

        if (bookingResponse.ok) {
          if (bookingData.status === 'already_exists') {
              toast({
                  title: "Booking Already Exists",
                  description: bookingData.message || "This free demo has already been booked.",
                  variant: "default",
              });
          } else {
              toast({
                  title: "Free Demo Booked!",
                  description: `Your free demo with ${teacher.name} has been successfully booked. Check your upcoming lessons!`,
                  variant: "default",
              });
          }
          router.push("/dashboard/upcoming-lessons");
        } else {
          console.error("[BookLessonPage CLIENT] Failed to book free demo:", bookingData);
          toast({
            title: "Booking Failed",
            description: bookingData.message || "There was an issue booking your free demo. Please try again.",
            variant: "destructive",
          });
        }

      } else {
        const params = new URLSearchParams({
          success: 'true',
          teacherId: teacher.id,
          lessonType: bookingType,
          lessonDate: bookingDateTime.toISOString(),
          lessonDuration: String(lessonDurationNum),
          amount: String(amountToSend),
          ...(lessonFocus && { lessonFocus: lessonFocus }),
          ...(notes && { notes: notes }),
          ...(bookingType === "monthly" && {
            classesPerMonth: String(classesPerMonth),
            subscriptionDuration: String(subscriptionDuration),
            selectedDays: JSON.stringify(selectedDays),
            preferredTimeSlot: preferredTimeSlot,
          }),
        });

        const successUrl = `${window.location.origin}/dashboard/upcoming-lessons?${params.toString()}`;
        const cancelUrl = `${window.location.origin}/dashboard/upcoming-lessons?canceled=true`;

        console.log("[BookLessonPage CLIENT] Preparing Stripe checkout for PAID lesson.");
        console.log("[BookLessonPage CLIENT] Prepared successUrl:", successUrl);
        console.log("[BookLessonPage CLIENT] Prepared CancelUrl:", cancelUrl);

        const checkoutResponse = await fetch("/api/payments/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teacherId: teacher.id,
            studentId: currentUser.id,
            lessonType: bookingType,
            lessonDate: bookingDateTime.toISOString(),
            lessonDuration: lessonDurationNum,
            amount: amountToSend,
            currency: 'USD',
            successUrl,
            cancelUrl,
            lessonFocus: lessonFocus,
            notes: notes,
            classesPerMonth: bookingType === "monthly" ? Number.parseInt(classesPerMonth) : undefined,
            subscriptionDuration: bookingType === "monthly" ? Number.parseInt(subscriptionDuration) : undefined,
            selectedDays: bookingType === "monthly" ? selectedDays : undefined,
            preferredTimeSlot: bookingType === "monthly" ? preferredTimeSlot : undefined,
          }),
        });

        const session = await checkoutResponse.json();

        // FIXED: Change session.url to session.checkoutUrl
        if (checkoutResponse.ok && session.checkoutUrl) {
          console.log("Stripe checkout session created. Redirecting to:", session.checkoutUrl);
          window.location.href = session.checkoutUrl; // Use session.checkoutUrl for redirection
        } else {
          console.error("Failed to create Stripe checkout session:", session);
          toast({
            title: "Payment Error",
            description: session.message || "Failed to initiate payment. Please try again.",
            variant: "destructive",
          });
        }
      }

    } catch (error) {
      console.error("Error during booking process:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading teacher details...</p>
      </div>
    );
  }

  if (fetchError || !teacher) {
    return (
        <div className="container px-4 py-6 md:px-6 md:py-8 flex items-center justify-center min-h-[60vh] text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <p>Teacher information could not be loaded or found. Please ensure the URL is correct or try again.</p>
            <Button onClick={() => router.push("/dashboard/find-teachers")} className="mt-4 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
              Find Other Teachers
            </Button>
        </div>
    );
  }

  const price = calculatePrice();

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/find-teachers"
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to teacher search
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
                      <span className="font-medium">${(teacher.hourlyRate).toFixed(2)}/hour</span>
                    </div>

                    {bookingType === "trial" && teacher.trialClassAvailable && (
                      <div className="flex justify-between">
                        <span className="text-sm">Trial class</span>
                        <span className="font-medium">${(teacher.trialClassPrice ?? 0).toFixed(2)}</span>
                      </div>
                    )}

                    {bookingType === "free-demo" && teacher.freeDemoAvailable && (
                      <div className="flex justify-between">
                        <span className="text-sm">Free Demo</span>
                        <span className="font-medium text-green-600">FREE</span>
                      </div>
                    )}

                    {bookingType === "single" && lessonDuration && (
                      <div className="flex justify-between">
                        <span className="text-sm">Duration</span>
                        <span className="font-medium">{lessonDuration} minutes</span>
                      </div>
                    )}

                    {bookingType === "monthly" && teacher.discounts && (
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
                    onValueChange={(value) => setBookingType(value as "single" | "monthly" | "trial" | "free-demo")}
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

                    {teacher.discounts && (
                      <div className="flex items-center justify-between rounded-md border p-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="monthly" id="booking-monthly" />
                          <Label htmlFor="booking-monthly" className="font-medium">
                            Monthly Subscription
                          </Label>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Save up to{" "}
                          {Math.max(
                            teacher.discounts?.monthly4 || 0,
                            teacher.discounts?.monthly8 || 0,
                            teacher.discounts?.monthly12 || 0
                          )}%
                          with regular lessons
                        </div>
                      </div>
                    )}

                    {teacher.trialClassAvailable && (
                      <div className="flex items-center justify-between rounded-md border p-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="trial" id="booking-trial" />
                          <Label htmlFor="booking-trial" className="font-medium">
                            Paid Trial Lesson
                          </Label>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Try a discounted 30-minute lesson for ${(teacher.trialClassPrice ?? 0).toFixed(2)}
                        </div>
                      </div>
                    )}

                    {teacher.freeDemoAvailable && (
                      <div className="flex items-center justify-between rounded-md border p-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="free-demo" id="booking-free-demo" />
                          <Label htmlFor="booking-free-demo" className="font-medium">
                            Free Demo Class
                          </Label>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Try a {teacher.freeDemoDuration ?? 30}-minute class for FREE
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
                    Schedule Your{" "}
                    {bookingType === "trial" ? "Paid Trial" :
                     bookingType === "free-demo" ? "Free Demo" :
                     bookingType === "monthly" ? "Monthly" : ""}{" "}
                    Lessons
                  </CardTitle>
                  <CardDescription>
                    {bookingType === "single" && "Choose when you want to have your lesson"}
                    {bookingType === "monthly" && "Set up your recurring lesson schedule"}
                    {bookingType === "trial" && "Choose when you want to have your paid trial lesson"}
                    {bookingType === "free-demo" && "Choose when you want to have your free demo lesson"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(bookingType === "single" || bookingType === "trial" || bookingType === "free-demo") && (
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
                              <span className="font-medium">${((teacher.hourlyRate) * 0.5).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border p-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="60" id="duration-60" />
                                <Label htmlFor="duration-60" className="font-normal">
                                  60 minutes
                                </Label>
                              </div>
                              <span className="font-medium">${(teacher.hourlyRate).toFixed(2)}</span>
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
                        <Select value={classesPerMonth} onValueChange={setClassesPerMonth}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4 classes</SelectItem>
                            <SelectItem value="8">8 classes</SelectItem>
                            <SelectItem value="12">12 classes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Subscription Duration</Label>
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
                        <Label>Preferred Days</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                            <div key={day} className="flex items-center space-x-2 rounded-md border p-4">
                              <Checkbox
                                id={`day-${day}`}
                                checked={selectedDays.includes(day)}
                                onCheckedChange={() => handleDayToggle(day)}
                              />
                              <Label htmlFor={`day-${day}`}>{day}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Time Slot</Label>
                        <Select value={preferredTimeSlot} onValueChange={setPreferredTimeSlot}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preferred time" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Assuming some common time slots, adjust as needed */}
                            {["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "14:00 - 15:00", "15:00 - 16:00"].map(slot => (
                              <SelectItem key={slot} value={slot}>
                                {slot}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={() => setStep(3)}>
                    Continue
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Details</CardTitle>
                  <CardDescription>Tell us about your learning goals and any specific notes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="lesson-focus">What do you want to focus on?</Label>
                    <Select value={lessonFocus} onValueChange={setLessonFocus}>
                      <SelectTrigger id="lesson-focus">
                        <SelectValue placeholder="Select a focus area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grammar">Grammar</SelectItem>
                        <SelectItem value="conversation">Conversation</SelectItem>
                        <SelectItem value="vocabulary">Vocabulary</SelectItem>
                        <SelectItem value="test-prep">Test Preparation</SelectItem>
                        <SelectItem value="business-language">Business Language</SelectItem>
                        <SelectItem value="cultural-insights">Cultural Insights</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional notes for the teacher (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="e.g., 'I want to practice ordering food at a restaurant.', 'I'm a beginner with some basic phrases.'"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={() => setStep(4)}>
                    Continue
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review & Confirm</CardTitle>
                  <CardDescription>Please review your booking details before confirming.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5"/> Lesson Summary</h3>
                    <p>
                      <strong>Teacher:</strong> {teacher.name}
                    </p>
                    <p>
                      <strong>Booking Type:</strong>{" "}
                      {bookingType === "single" ? "Single Lesson" :
                       bookingType === "monthly" ? `Monthly Subscription (${classesPerMonth} classes/month for ${subscriptionDuration} months)` :
                       bookingType === "trial" ? "Paid Trial Lesson" :
                       "Free Demo Class"}
                    </p>
                    {(bookingType === "single" || bookingType === "trial" || bookingType === "free-demo") && (
                      <>
                        <p>
                          <strong>Date:</strong> {selectedDate}
                        </p>
                        <p>
                          <strong>Time:</strong> {selectedTimeSlot}
                        </p>
                        <p>
                          <strong>Duration:</strong> {lessonDuration} minutes
                        </p>
                      </>
                    )}
                    {bookingType === "monthly" && (
                      <>
                        <p>
                          <strong>Preferred Days:</strong> {selectedDays.join(", ") || "N/A"}
                        </p>
                        <p>
                          <strong>Preferred Time:</strong> {preferredTimeSlot || "N/A"}
                        </p>
                      </>
                    )}
                    <p>
                      <strong>Focus:</strong> {lessonFocus || "Not specified"}
                    </p>
                    {notes && (
                      <p>
                        <strong>Notes:</strong> {notes}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5"/> Payment Summary</h3>
                    <div className="flex justify-between">
                      <span>Original Price:</span>
                      <span>${price.original.toFixed(2)}</span>
                    </div>
                    {price.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({price.discount}%):</span>
                        <span>-${(price.original - price.discounted).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${price.total.toFixed(2)}</span>
                    </div>
                    {price.total === 0 && (
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Info className="h-4 w-4 mr-1"/> No payment required for this booking.
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" onClick={handleBookLesson} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    {loading ? "Processing..." : price.total === 0 ? "Confirm Free Booking" : `Pay $${price.total.toFixed(2)}`}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
