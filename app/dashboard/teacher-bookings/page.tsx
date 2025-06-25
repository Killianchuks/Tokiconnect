// app/dashboard/teacher-bookings/page.tsx
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CalendarCheck, Clock, DollarSign, BookOpen, User as UserIcon, Link as LinkIcon, ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { teacherService } from "@/lib/api-service";
import { authService } from "@/lib/api-service";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Booking {
  id: string;
  studentName: string;
  lessonType: string;
  lessonDate: string;
  lessonDurationMinutes: number;
  amount: number;
  currency: string;
  status: string;
  notes?: string;
  createdAt: string;
  meetingLink?: string;
}

interface CurrentUser {
  id: string;
  email: string;
  role: "student" | "teacher" | "admin";
  first_name: string;
  last_name: string;
}

export default function TeacherBookingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [currentDateTime, setCurrentDateTime] = useState(new Date()); // Define `now` in component scope

  useEffect(() => {
    const fetchBookings = async () => {
      setPageLoading(true);
      setFetchError(null);
      setAccessDenied(false);

      try {
        const user = await authService.getCurrentUser();
        console.log(`[TeacherBookingsPage CLIENT] Auth User fetched: ${user ? `ID: ${user.id}, Role: ${user.role}` : 'None'}`);

        if (!user || user.role !== 'teacher') {
          console.warn("[TeacherBookingsPage CLIENT] User not a teacher or not logged in. Setting accessDenied to true.");
          setCurrentUser(null);
          setAccessDenied(true);
          setAllBookings([]);
          setUpcomingBookings([]);
          setPastBookings([]);
          return;
        }
        setCurrentUser(user);
        console.log(`[TeacherBookingsPage CLIENT] User is a teacher (${user.id}). Proceeding to fetch bookings.`);


        const response = await fetch(`/api/teachers/me/bookings`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch bookings.');
        }

        const data: Booking[] = await response.json();
        setAllBookings(data);

        const now = new Date(); // Define now here for filtering data
        setCurrentDateTime(now); // Set to state so it's available for renderBookings

        const upcoming = data.filter(booking => new Date(booking.lessonDate) > now);
        const past = data.filter(booking => new Date(booking.lessonDate) <= now);

        const sortedUpcoming = upcoming.sort((a, b) => new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime());
        const sortedPast = past.sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());

        setUpcomingBookings(sortedUpcoming);
        setPastBookings(sortedPast);

        console.log(`[TeacherBookingsPage CLIENT] Fetched total ${data.length} bookings. Upcoming: ${sortedUpcoming.length}, Past: ${sortedPast.length}`);

      } catch (error) {
        console.error("Error fetching teacher bookings:", error);
        setFetchError("Failed to load your bookings. " + (error instanceof Error ? error.message : "An unknown error occurred."));
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load bookings. Please try again later.",
          variant: "destructive",
        });
        setAllBookings([]);
        setUpcomingBookings([]);
        setPastBookings([]);
        setCurrentUser(null);
        setAccessDenied(true);
      } finally {
        setPageLoading(false);
        console.log("[TeacherBookingsPage CLIENT] Page data loading finished.");
      }
    };

    fetchBookings();
  }, [router, toast]);

  if (pageLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8 flex flex-col items-center justify-center min-h-[60vh] text-red-600">
        <AlertCircle className="h-8 w-8 mr-2" />
        <p className="mt-2 text-center">
          Access Denied. Please ensure you are logged in as a teacher to view this page.
        </p>
        <Button onClick={() => router.push("/login")} className="mt-4 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
          Go to Login
        </Button>
      </div>
    );
  }

  // Pass currentDateTime to renderBookings so it's in scope
  const renderBookings = (bookingsToRender: Booking[], now: Date) => { // ADDED 'now: Date' parameter
    if (bookingsToRender.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <CalendarCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {activeTab === "upcoming" ? "No upcoming bookings found." : "No past bookings found."}
            </p>
            {activeTab === "upcoming" && (
              <Button onClick={() => router.push('/dashboard/schedule')} className="mt-4 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                Set Your Availability
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bookingsToRender.map((booking) => (
          <Card key={booking.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full ${
              booking.status === 'confirmed' ? 'bg-green-500' :
              booking.status === 'completed' ? 'bg-blue-500' :
              'bg-gray-400'
            }`} />
            <CardHeader className="pl-6">
              <CardTitle className="flex items-center text-xl">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                {booking.lessonType.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </CardTitle>
              <CardDescription className="flex items-center text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4 mr-1"/> Student: {booking.studentName || "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pl-6">
              <p className="flex items-center text-sm">
                <CalendarCheck className="h-4 w-4 mr-2 text-gray-500" />
                Date: {booking.lessonDate}
              </p>
              <p className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                Duration: {booking.lessonDurationMinutes} minutes
              </p>
              <p className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                Amount: {booking.currency} {booking.amount.toFixed(2)}
              </p>
              <span className="text-sm">Status: <Badge>{booking.status}</Badge></span>

              {booking.meetingLink && (
                <p className="flex items-center text-sm mt-2">
                  <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
                  <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                    Join Lesson
                  </a>
                </p>
              )}
            </CardContent>
            <CardFooter className="pl-6 flex justify-end">
                {/* Check if the booking is confirmed and in the past or currently active */}
                {booking.status === 'confirmed' && new Date(booking.lessonDate) <= now && ( // FIXED: Use 'now' parameter
                    <Button variant="secondary" size="sm">Mark Complete</Button>
                )}
                <Button variant="outline" size="sm" className="ml-2">View Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Bookings</h1>
        <p className="text-muted-foreground">View your upcoming and past lessons.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          {renderBookings(upcomingBookings, currentDateTime)} {/* FIXED: Pass currentDateTime */}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {renderBookings(pastBookings, currentDateTime)} {/* FIXED: Pass currentDateTime */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
