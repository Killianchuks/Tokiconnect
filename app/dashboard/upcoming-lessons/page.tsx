// app/dashboard/upcoming-lessons/page.tsx
"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Loader2,
  CalendarCheck,
  Info,
  Clock,
  DollarSign,
  BookOpen,
  User as UserIcon,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/api-service";
import { Badge } from '@/components/ui/badge';

interface Booking {
  id: string;
  teacherName: string;
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

export default function UpcomingLessonsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // Ref to store the *full, raw query string* that has been processed for a booking.
  // This prevents re-processing the same URL parameters on re-renders.
  const processedUrlKeyRef = useRef<string | null>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<'pending' | 'confirmed' | 'failed' | 'already_exists' | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Memoize the loadPageData function
  const loadPageData = useCallback(async () => {
    setPageLoading(true);
    setAccessDenied(false); // Reset access denied state on new load attempt

    try {
      const user = await authService.getCurrentUser();
      console.log(`[UpcomingLessonsPage CLIENT - loadPageData] Auth User fetched: ${user ? `ID: ${user.id}, Role: ${user.role}` : 'None'}`);

      if (!user || user.role !== 'student') {
        console.warn("[UpcomingLessonsPage CLIENT - loadPageData] User not logged in or not a student. Setting accessDenied to true.");
        setCurrentUser(null);
        setAccessDenied(true);
        setUpcomingBookings([]);
        return;
      }

      setCurrentUser(user);
      console.log(`[UpcomingLessonsPage CLIENT - loadPageData] User is a student (${user.id}). Proceeding to fetch bookings.`);

      const response = await fetch(`/api/students/me/bookings`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch upcoming lessons.');
      }

      const data: Booking[] = await response.json();
      const now = new Date();
      const upcoming = data.filter(booking => new Date(booking.lessonDate) > now);

      const sortedBookings = upcoming.sort((a, b) => new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime());
      setUpcomingBookings(sortedBookings);
      console.log("[UpcomingLessonsPage CLIENT - loadPageData] Successfully fetched and filtered upcoming bookings:", sortedBookings);

    } catch (error) {
      console.error("[UpcomingLessonsPage CLIENT - loadPageData] Error during page data loading (user or bookings fetch):", error);
      toast({
        title: "Error",
        description: "Failed to load page data. " + (error instanceof Error ? error.message : "An unknown error occurred."),
        variant: "destructive",
      });
      setUpcomingBookings([]);
      setCurrentUser(null);
      setAccessDenied(true);
    } finally {
      setPageLoading(false);
      console.log("[UpcomingLessonsPage CLIENT - loadPageData] Page data loading finished.");
    }
  }, [toast]);


  // Main Effect: Handles URL parameters for booking creation/cancellation and general page data loading
  useEffect(() => {
    const currentRawParams = searchParams.toString();
    const hasSuccessParam = searchParams.get('success') === 'true';
    const hasCanceledParam = searchParams.get('canceled') === 'true';

    console.log(`\n--- [UpcomingLessonsPage CLIENT - Main useEffect] Firing ---`);
    console.log(`  Current URL Search Params (raw): "${currentRawParams}"`);
    console.log(`  processedUrlKeyRef.current: "${processedUrlKeyRef.current}"`);
    console.log(`  paymentSuccess param: ${searchParams.get('success')}, hasSuccessParam (derived): ${hasSuccessParam}`);
    console.log(`  paymentCanceled param: ${searchParams.get('canceled')}, hasCanceledParam (derived): ${hasCanceledParam}`);
    console.log(`  Initial loading state: ${pageLoading}, Booking status: ${bookingStatus}`);


    // Retrieve all booking parameters directly from searchParams
    const teacherId = searchParams.get('teacherId');
    const lessonType = searchParams.get('lessonType');
    const lessonDate = searchParams.get('lessonDate');
    const lessonDuration = searchParams.get('lessonDuration');
    const amount = searchParams.get('amount');

    console.log(`[UpcomingLessonsPage CLIENT - Main useEffect] Extracted Params at Effect Start:`);
    console.log(`  teacherId: "${teacherId}" (Type: ${typeof teacherId})`);
    console.log(`  lessonType: "${lessonType}" (Type: ${typeof lessonType})`);
    console.log(`  lessonDate: "${lessonDate}" (Type: ${typeof lessonDate})`);
    console.log(`  lessonDuration: "${lessonDuration}" (Type: ${typeof lessonDuration})`);
    console.log(`  amount: "${amount}" (Type: ${typeof amount})`);


    // Scenario 1: Payment Success redirect with booking parameters
    // This condition checks:
    // 1. If 'success=true' is present and 'canceled=true' is NOT present.
    // 2. If these exact URL parameters haven't been processed in the current session yet.
    if (hasSuccessParam && !hasCanceledParam && currentRawParams !== processedUrlKeyRef.current) {
        console.log("[UpcomingLessonsPage CLIENT - Main useEffect] Branch: Detected NEW payment success redirect. Attempting booking POST.");
        processedUrlKeyRef.current = currentRawParams; // Mark these specific parameters as processed

        setBookingStatus('pending'); // Set loading state for booking creation
        console.log("[UpcomingLessonsPage CLIENT] Starting POST to /api/bookings/create...");

        // AGGRESSIVE VALIDATION: Ensure all critical parameters are present and non-empty.
        if (teacherId && lessonType && lessonDate && lessonDuration !== null && amount !== null && amount !== '') {
            const confirmBooking = async () => {
                try {
                    const payload = {
                        teacherId: teacherId,
                        lessonType: lessonType,
                        lessonDate: lessonDate,
                        lessonDuration: parseInt(lessonDuration),
                        amount: parseFloat(amount),
                    };

                    console.log("[UpcomingLessonsPage CLIENT] Sending booking creation POST to /api/bookings/create with payload:", JSON.stringify(payload, null, 2));

                    const response = await fetch('/api/bookings/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    const data = await response.json();
                    console.log("[UpcomingLessonsPage CLIENT] Response from /api/bookings/create:", JSON.stringify(data, null, 2));

                    if (response.ok) {
                        if (data.status === 'already_exists' || data.status === 'already_exists_db_conflict') {
                            setBookingStatus('already_exists');
                            toast({
                                title: "Booking Already Exists",
                                description: data.message || "This lesson has already been booked. No duplicate created.",
                                variant: "default",
                            });
                        } else {
                            setBookingStatus('confirmed');
                            toast({
                                title: "Payment Successful!",
                                description: "Your lesson has been successfully booked and confirmed.",
                                variant: "default",
                            });
                        }
                    } else {
                        // Backend returned non-200 OK
                        setBookingStatus('failed');
                        toast({
                            title: "Booking Failed",
                            description: data.message || "There was an issue confirming your lesson after payment. Please contact support.",
                            variant: "destructive",
                        });
                    }
                } catch (error) {
                    // Network error or JSON parsing error
                    console.error("[UpcomingLessonsPage CLIENT] Network/Processing Error during booking POST:", error);
                    setBookingStatus('failed');
                    toast({
                        title: "Booking Error",
                        description: "An unexpected error occurred while confirming your lesson. Please contact support.",
                        variant: "destructive",
                    });
                } finally {
                    console.log("[UpcomingLessonsPage CLIENT] Booking POST attempt finished. Cleaning URL.");
                    router.replace('/dashboard/upcoming-lessons'); // Clean URL for fresh state
                }
            };

            confirmBooking(); // Execute the async function
        } else {
            console.error("[UpcomingLessonsPage CLIENT - Main useEffect] CRITICAL: Essential booking parameters were missing or invalid in URL. Not initiating POST. Params:", {
                teacherId, lessonType, lessonDate, lessonDuration, amount
            });
            setBookingStatus('failed'); // Indicate failure due to missing/invalid params
            toast({
                title: "Booking Failed",
                description: "Critical booking details were missing from the URL. Please try again from the teacher's profile.",
                variant: "destructive",
            });
            router.replace('/dashboard/upcoming-lessons'); // Clean URL
        }
    }
    // Scenario 2: Payment Canceled redirect
    else if (hasCanceledParam && !hasSuccessParam && currentRawParams !== processedUrlKeyRef.current) {
        console.log("[UpcomingLessonsPage CLIENT - Main useEffect] Branch: Detected NEW payment canceled redirect. Cleaning URL.");
        processedUrlKeyRef.current = currentRawParams; // Mark these specific parameters as processed

        setBookingStatus('failed');
        toast({
            title: "Payment Canceled",
            description: "Your booking was not completed.",
            variant: "destructive",
        });
        router.replace('/dashboard/upcoming-lessons'); // Clean URL
    }
    // Scenario 3: Normal page load (no payment params) or after URL has been cleaned by router.replace
    else if (!hasSuccessParam && !hasCanceledParam) {
        console.log("[UpcomingLessonsPage CLIENT - Main useEffect] Branch: No payment-related params detected. Loading page data normally or after URL cleanup.");
        // If the URL is clean, reset the ref to allow new booking attempts in the future
        if (processedUrlKeyRef.current !== null) {
          console.log("[UpcomingLessonsPage CLIENT] Resetting processedUrlKeyRef to null.");
          processedUrlKeyRef.current = null;
        }
        // Only load data if not currently in 'pending' booking status
        if (bookingStatus !== 'pending') {
           loadPageData();
        } else {
            console.log("[UpcomingLessonsPage CLIENT] Currently in 'pending' booking status, deferring normal loadPageData.");
        }
    } else {
      console.log("[UpcomingLessonsPage CLIENT - Main useEffect] Branch: No action taken. Either params already processed or booking is pending from another flow.");
    }

    console.log(`--- [UpcomingLessonsPage CLIENT - Main useEffect] Finished ---`);

  }, [searchParams, router, toast, loadPageData]); // Simplified dependencies

  // Secondary effect to always load page data if the URL is clean (no success/canceled params)
  // and the booking process isn't ongoing (not 'pending').
  // This acts as a reliable final trigger for loadPageData after redirects.
  useEffect(() => {
    // This effect's primary job is to ensure loadPageData runs when the URL becomes clean
    // (after router.replace) and no booking processing is active.
    const currentParams = searchParams.toString();
    const hasPaymentParams = currentParams.includes('success=true') || currentParams.includes('canceled=true');

    console.log(`\n--- [UpcomingLessonsPage CLIENT - Secondary useEffect] Firing ---`);
    console.log(`  bookingStatus: ${bookingStatus}`);
    console.log(`  hasPaymentParams: ${hasPaymentParams}`);

    if (bookingStatus !== 'pending' && !hasPaymentParams) {
      console.log("[UpcomingLessonsPage CLIENT - Secondary useEffect] Condition met: Loading data.");
      loadPageData();
    } else {
      console.log("[UpcomingLessonsPage CLIENT - Secondary useEffect] Condition NOT met. Not loading data (either booking pending or payment params present).");
    }
    console.log(`--- [UpcomingLessonsPage CLIENT - Secondary useEffect] Finished ---`);
  }, [bookingStatus, searchParams, loadPageData]);


  const displayTitle = () => {
    if (pageLoading && bookingStatus === null) return "Loading...";
    if (bookingStatus === 'pending') return "Confirming Your Lesson...";
    if (bookingStatus === 'confirmed') return "Lesson Booked Successfully!";
    if (bookingStatus === 'already_exists') return "Lesson Already Booked!";
    if (bookingStatus === 'failed' && searchParams.get('canceled') === 'true') return "Booking Canceled";
    if (bookingStatus === 'failed') return "Booking Failed";
    return "Your Upcoming Lessons";
  };

  const displayDescription = () => {
    if (pageLoading && bookingStatus === null) return "Please wait...";
    if (bookingStatus === 'pending') return "We are finalizing your lesson details. This may take a moment.";
    if (bookingStatus === 'confirmed') return "Your payment was successful, and your lesson has been confirmed. You will receive an email shortly with details.";
    if (bookingStatus === 'already_exists') return "It looks like this lesson was already booked. Check your upcoming lessons.";
    if (bookingStatus === 'failed' && searchParams.get('canceled') === 'true') return "It looks like your payment was canceled. You can try booking again.";
    if (bookingStatus === 'failed') return "There was an issue confirming your lesson. Please review the details or contact support.";
    return "Here you will find all your scheduled and completed lessons.";
  };

  const displayIcon = () => {
    if (pageLoading || bookingStatus === 'pending') return <Loader2 className="h-16 w-16 text-blue-500 mb-4 animate-spin" />;
    if (bookingStatus === 'confirmed') return <CheckCircle className="h-16 w-16 text-green-500 mb-4" />;
    if (bookingStatus === 'already_exists') return <Info className="h-16 w-16 text-yellow-500 mb-4" />;
    if (bookingStatus === 'failed') return <XCircle className="h-16 w-16 text-red-500 mb-4" />;
    return <CalendarCheck className="h-16 w-16 text-gray-500 mb-4" />;
  };

  if (pageLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading your lessons and user data...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8 flex flex-col items-center justify-center min-h-[60vh] text-red-600">
        <AlertCircle className="h-8 w-8 mr-2" />
        <p className="mt-2 text-center">
          Access Denied. Please ensure you are logged in as a student to view this page.
        </p>
        <Button onClick={() => router.push("/login")} className="mt-4 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8 flex flex-col items-center">
      <Card className="w-full max-w-md text-center mb-8">
        <CardHeader className="flex flex-col items-center">
          {displayIcon()}
          <CardTitle className="text-2xl">{displayTitle()}</CardTitle>
          <CardDescription>{displayDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(bookingStatus === 'confirmed' || bookingStatus === 'failed' || bookingStatus === 'already_exists' || bookingStatus === null) && (
            <div className="flex flex-col gap-2">
              <Button asChild className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                <Link href="/dashboard/find-teachers">Book Another Lesson</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="w-full max-w-2xl space-y-4">
        <h2 className="text-2xl font-bold tracking-tight mb-4 text-center">Your Scheduled Lessons</h2>
        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">You have no upcoming lessons scheduled.</p>
              <Button asChild onClick={() => router.push('/dashboard/find-teachers')} className="mt-4 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                <Link href="/dashboard/find-teachers">Find a Teacher to Book</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingBookings.map((booking) => (
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
                    <UserIcon className="h-4 w-4 mr-1"/> Teacher: {booking.teacherName || "N/A"}
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
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
