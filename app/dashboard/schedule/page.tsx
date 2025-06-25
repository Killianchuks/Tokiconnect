"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusCircle, MinusCircle, Loader2, Save, AlertCircle, X, Link as LinkIcon } from "lucide-react" // Added LinkIcon
import { useToast } from "@/hooks/use-toast"
import { authService, teacherService } from "@/lib/api-service"
import type { Teacher, TeacherAvailability, TeacherDiscounts } from "@/lib/api-service"
import { Skeleton } from "@/components/ui/skeleton"

// For Calendar Display
import { Calendar } from "@/components/ui/calendar"
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"


interface CurrentUser {
  id: string;
  email: string;
  role: "student" | "teacher" | "admin";
  first_name: string;
  last_name: string;
  language?: string;
}

export default function SchedulePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Availability states
  const [teacherAvailability, setTeacherAvailability] = useState<TeacherAvailability[]>([]);
  // Discounts states
  const [monthly4Discount, setMonthly4Discount] = useState<string>("0");
  const [monthly8Discount, setMonthly8Discount] = useState<string>("0");
  const [monthly12Discount, setMonthly12Discount] = useState<string>("0");
  // NEW: Default Meeting Link state
  const [defaultMeetingLink, setDefaultMeetingLink] = useState<string>("");

  // Calendar State for display purposes
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const user = await authService.getCurrentUser()
        if (!user || user.role !== "teacher") {
          toast({
            title: "Access Denied",
            description: "You must be a teacher to access this page.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }
        setCurrentUser(user)

        const profile = await teacherService.getMyProfile()
        if (profile) {
          setTeacherProfile(profile)
          setTeacherAvailability(profile.availability || []);
          setMonthly4Discount(profile.discounts?.monthly4?.toString() || "0");
          setMonthly8Discount(profile.discounts?.monthly8?.toString() || "0");
          setMonthly12Discount(profile.discounts?.monthly12?.toString() || "0");
          setDefaultMeetingLink(profile.defaultMeetingLink || ""); // NEW: Set initial meeting link

          console.log("[SchedulePage CLIENT] Fetched Teacher Profile:", profile);
          console.log("[SchedulePage CLIENT] Initial Availability State:", profile.availability);
          console.log("[SchedulePage CLIENT] Initial Discounts State:", profile.discounts);
          console.log("[SchedulePage CLIENT] Initial Default Meeting Link State:", profile.defaultMeetingLink);


        } else {
           setFetchError("Teacher profile data not found. Please contact support.");
           toast({
              title: "Profile Data Missing",
              description: "Teacher profile data could not be loaded. Please contact support.",
              variant: "destructive",
           });
        }
      } catch (error) {
        console.error("Error fetching user data for Schedule page:", error)
        setFetchError("Failed to load schedule data. " + (error instanceof Error ? error.message : "An unknown error occurred."));
        toast({
          title: "Error",
          description: "Failed to load schedule data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchProfileData()
  }, [router, toast])


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "teacher") {
      toast({
        title: "Error",
        description: "You must be a teacher to save schedule settings.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    setFetchError(null);

    try {
      const updatedData = {
        availability: teacherAvailability,
        discounts: {
          monthly4: parseFloat(monthly4Discount),
          monthly8: parseFloat(monthly8Discount),
          monthly12: parseFloat(monthly12Discount),
        },
        defaultMeetingLink: defaultMeetingLink, // NEW: Include defaultMeetingLink
      };

      console.log("[SchedulePage CLIENT] Sending update data to API:", updatedData);
      console.log("[SchedulePage CLIENT] Availability being sent:", updatedData.availability);
      console.log("[SchedulePage CLIENT] Discounts being sent:", updatedData.discounts);
      console.log("[SchedulePage CLIENT] Default Meeting Link being sent:", updatedData.defaultMeetingLink);


      const updatedProfile = await teacherService.updateMyProfile(updatedData);
      if (updatedProfile) {
          setTeacherProfile(updatedProfile);
          setTeacherAvailability(updatedProfile.availability || []);
          setMonthly4Discount(updatedProfile.discounts?.monthly4?.toString() || "0");
          setMonthly8Discount(updatedProfile.discounts?.monthly8?.toString() || "0");
          setMonthly12Discount(updatedProfile.discounts?.monthly12?.toString() || "0");
          setDefaultMeetingLink(updatedProfile.defaultMeetingLink || ""); // NEW: Update state with saved link

          console.log("[SchedulePage CLIENT] API returned updated profile:", updatedProfile);
          console.log("[SchedulePage CLIENT] Updated Availability from API:", updatedProfile.availability);
          console.log("[SchedulePage CLIENT] Updated Discounts from API:", updatedProfile.discounts);
          console.log("[SchedulePage CLIENT] Updated Default Meeting Link from API:", updatedProfile.defaultMeetingLink);

      } else {
          setFetchError("Schedule update failed. No data returned.");
          toast({
              title: "Error",
              description: "Failed to update schedule. Please try again.",
              variant: "destructive"
          });
      }

      toast({
        title: "Schedule updated",
        description: "Your availability, discount, and meeting link settings have been updated successfully",
      })
    } catch (error) {
      console.error("Error updating schedule:", error)
      setFetchError("Failed to update schedule. " + (error instanceof Error ? error.message : "An unknown error occurred."));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while updating your schedule",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Availability handlers
  const handleAvailabilityChange = (index: number, field: keyof TeacherAvailability, value: string) => {
    const newAvailability = [...teacherAvailability];
    newAvailability[index] = { ...newAvailability[index], [field]: value };
    setTeacherAvailability(newAvailability);
  };

  const handleAddAvailability = () => {
    setTeacherAvailability([...teacherAvailability, { day: "", slots: [""] }]);
  };

  const handleRemoveAvailability = (index: number) => {
    setTeacherAvailability(teacherAvailability.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, slotIndex: number, value: string) => {
    const newAvailability = [...teacherAvailability];
    if (newAvailability[index]) {
      const newSlots = [...newAvailability[index].slots];
      newSlots[slotIndex] = value;
      newAvailability[index].slots = newSlots;
      setTeacherAvailability(newAvailability);
    }
  };

  const handleAddSlot = (index: number) => {
    const newAvailability = [...teacherAvailability];
    if (newAvailability[index]) {
      newAvailability[index].slots = [...newAvailability[index].slots, ""];
      setTeacherAvailability(newAvailability);
    }
  };

  const handleRemoveSlot = (index: number, slotIndex: number) => {
    const newAvailability = [...teacherAvailability];
    if (newAvailability[index]) {
      newAvailability[index].slots = newAvailability[index].slots.filter((_, i) => i !== slotIndex);
      setTeacherAvailability(newAvailability);
    }
  };

  // Helper for Calendar: get days that have defined availability
  const getDaysWithAvailability = () => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const availableWeekdays = new Set(teacherAvailability.map(item => item.day));

    const today = new Date();
    // Show availability for a few months from now
    const startDate = startOfMonth(addMonths(today, -1));
    const endDate = endOfMonth(addMonths(today, 3));

    const daysWithSlots = eachDayOfInterval({ start: startDate, end: endDate }).filter(date => {
      const dayName = format(date, 'EEEE');
      return availableWeekdays.has(dayName);
    });
    return daysWithSlots;
  };


  if (loading) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-4 w-2/3 mb-8" />
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (fetchError || !currentUser) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8 flex flex-col items-center justify-center min-h-[60vh] text-red-600">
        <AlertCircle className="h-8 w-8 mr-2" />
        <p className="mt-2 text-center">
          {fetchError || "Schedule could not be loaded. Please ensure you are logged in as a teacher."}
        </p>
        <Button onClick={() => router.push("/login")} className="mt-4 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
          Go to Login
        </Button>
      </div>
    );
  }

  const daysWithAvailability = getDaysWithAvailability();

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Schedule Settings</h1>
        <p className="text-muted-foreground">Manage your availability and lesson discounts.</p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>Set the days and time slots you are available for lessons.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teacherAvailability.map((availabilityItem, index) => (
                  <div key={index} className="border p-4 rounded-md space-y-3 relative bg-card">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveAvailability(index)}
                    >
                      <MinusCircle className="h-5 w-5" />
                    </Button>
                    <div className="space-y-2">
                      <Label>Day of Week</Label>
                      <Select
                        value={availabilityItem.day}
                        onValueChange={(value) => handleAvailabilityChange(index, 'day', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                            (day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Time Slots (HH:MM format)</Label>
                      {availabilityItem.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={slot}
                            onChange={(e) => handleSlotChange(index, slotIndex, e.target.value)}
                            placeholder="e.g., 09:00"
                            className="w-full"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSlot(index, slotIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddSlot(index)} className="mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Slot
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddAvailability} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Availability Period
                </Button>
              </CardContent>
            </Card>

            {/* NEW CARD: Default Meeting Link */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Lesson Meeting Link</CardTitle>
                <CardDescription>
                  Provide a default video conferencing link for your lessons (e.g., Google Meet, Zoom, custom link).
                  This link will be provided to students upon booking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="defaultMeetingLink">Meeting Link URL</Label>
                  <Input
                    id="defaultMeetingLink"
                    type="url" // Use type="url" for better validation and mobile keyboard
                    value={defaultMeetingLink}
                    onChange={(e) => setDefaultMeetingLink(e.target.value)}
                    placeholder="e.g., https://meet.google.com/your-room"
                  />
                  {defaultMeetingLink && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                      <LinkIcon className="h-4 w-4 mr-1"/> Your current link: <a href={defaultMeetingLink} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline truncate">{defaultMeetingLink}</a>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Discount Settings</CardTitle>
                <CardDescription>Set percentage discounts for monthly class packages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly4">4 classes/month discount (%)</Label>
                  <Input
                    id="monthly4"
                    type="number"
                    value={monthly4Discount}
                    onChange={(e) => setMonthly4Discount(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="e.g., 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly8">8 classes/month discount (%)</Label>
                  <Input
                    id="monthly8"
                    type="number"
                    value={monthly8Discount}
                    onChange={(e) => setMonthly8Discount(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="e.g., 15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly12">12 classes/month discount (%)</Label>
                  <Input
                    id="monthly12"
                    type="number"
                    value={monthly12Discount}
                    onChange={(e) => setMonthly12Discount(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="e.g., 20"
                  />
                </div>
              </CardContent>
            </Card>

            <CardFooter className="flex justify-end p-6 mt-6">
              <Button type="submit" className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Recurring Availability</CardTitle>
              <CardDescription>
                Days highlighted in green indicate you have set availability slots for that day of the week.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                selected={undefined}
                disabled={(date) => {
                  const dayName = format(date, 'EEEE');
                  return !teacherAvailability.some(item => item.day === dayName);
                }}
                modifiers={{
                  available: daysWithAvailability,
                }}
                modifiersStyles={{
                  available: {
                    backgroundColor: '#A8DADC',
                    color: '#2D3748',
                    borderRadius: '8px',
                  },
                }}
                className="rounded-md border p-4"
              />
            </CardContent>
             <CardContent className="text-sm text-muted-foreground pt-0">
                <p>
                  **Note:** This calendar shows your *recurring* weekly availability. If you wish to manage one-off schedule changes or connect to an external calendar, that functionality is under development.
                </p>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
