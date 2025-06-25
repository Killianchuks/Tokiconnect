// app/dashboard/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, BookOpen, Star, Loader2, Info } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast";
import { authService, userService } from "@/lib/api-service"; // Import authService and userService

interface UserData {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
  name?: string // Keep this for backward compatibility if `name` is used elsewhere
}

interface UserStats {
  lessonsCompleted: number
  lessonsUpcoming: number
  favoriteTeachers?: number
  activeStudents?: number
  averageRating: number // Ensure this is always a number
  totalHours: number
  languagesCount: number
}

// Define initial empty stats consistently
const initialStats: UserStats = {
  lessonsCompleted: 0,
  lessonsUpcoming: 0,
  averageRating: 0.0, // Initialize to a number
  totalHours: 0,
  languagesCount: 0,
  favoriteTeachers: 0, // Ensure these are initialized too
  activeStudents: 0,   // Ensure these are initialized too
};


export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  // Initialize stats with a complete default object to avoid .toFixed errors
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Memoize fetchUserStats to prevent re-creation on every render
  const fetchUserStats = useCallback(async (userId: string, userRole: string) => {
    try {
      console.log(`[DashboardPage CLIENT] Fetching user stats for ID: ${userId}, Role: ${userRole}`);
      // Use userService from api-service.ts
      const fetchedStats = await userService.getUserStats(); // This will return the correctly structured stats
      setStats(fetchedStats); // Set the received stats
      console.log("[DashboardPage CLIENT] Successfully fetched user stats:", fetchedStats);

    } catch (error) {
      console.error("[DashboardPage CLIENT] Error fetching user stats from API:", error);
      setFetchError("Failed to fetch dashboard statistics.");
      toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load dashboard statistics.",
          variant: "destructive"
      });
      // Set stats back to initial or a safe default on error
      setStats(initialStats);
    } finally {
      setIsLoading(false); // Ensure loading is false after API call
    }
  }, [toast]); // Dependencies for useCallback

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true); // Start loading
      setFetchError(null); // Reset error state

      try {
        // Hydration fix: Read localStorage ONLY on the client-side
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem("linguaConnectUser") : null;

        if (storedUser) {
          const userData: UserData = JSON.parse(storedUser);
          setUser(userData);
          console.log("[DashboardPage CLIENT] User data from localStorage:", userData);
          // Proceed to fetch stats once user data is loaded
          await fetchUserStats(userData.id, userData.role);
        } else {
          console.warn("[DashboardPage CLIENT] No user data found in localStorage. Attempting to fetch current user via authService.");
          // If no user in localStorage, try fetching via authService (e.g., if token is in cookies)
          const currentUserFromAuth = await authService.getCurrentUser();
          if (currentUserFromAuth) {
            setUser(currentUserFromAuth);
            // Store in localStorage for subsequent visits
            localStorage.setItem("linguaConnectUser", JSON.stringify(currentUserFromAuth));
            await fetchUserStats(currentUserFromAuth.id, currentUserFromAuth.role);
          } else {
            console.warn("[DashboardPage CLIENT] No user data from authService either. Redirecting to login.");
            router.push("/login");
            // Ensure loading is set to false even if redirecting, to prevent infinite spinner
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("[DashboardPage CLIENT] Error during initial user/stats load:", error);
        setFetchError("Failed to load dashboard data. Please try again.");
        toast({
            title: "Error",
            description: "Failed to load dashboard data. " + (error instanceof Error ? error.message : "An unknown error occurred."),
            variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [fetchUserStats, toast, router]); // fetchUserStats is a dependency

  // Handle loading and error states for the main page
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading dashboard...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[60vh] text-red-600">
        <Info className="h-8 w-8 mr-2" />
        <p className="mt-2 text-center">{fetchError}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
          Try Again
        </Button>
      </div>
    );
  }

  // Fallback if user somehow becomes null after loading (shouldn't happen with current logic, but good for type safety)
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[60vh] text-red-600">
        <Info className="h-8 w-8 mr-2" />
        <p className="mt-2 text-center">User data not available. Please log in again.</p>
        <Button onClick={() => router.push("/login")} className="mt-4 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
          Go to Login
        </Button>
      </div>
    );
  }


  const userName = user.first_name || user.name || user.email; // Fallback to email if no name
  const isTeacher = user.role === "teacher";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {userName}!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isTeacher
            ? "Manage your teaching schedule and connect with students."
            : "Track your language learning progress and connect with teachers."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Lessons</p>
                <h3 className="text-2xl font-bold">{stats.lessonsCompleted}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full dark:bg-green-900">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Lessons</p>
                <h3 className="text-2xl font-bold">{stats.lessonsUpcoming}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full dark:bg-blue-900">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {isTeacher ? "Active Students" : "Favorite Teachers"}
                </p>
                {/* Use optional chaining for teacher-specific or student-specific stats */}
                <h3 className="text-2xl font-bold">{isTeacher ? (stats.activeStudents ?? 0) : (stats.favoriteTeachers ?? 0)}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full dark:bg-purple-900">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Rating</p>
                {/* Ensure averageRating is always a number using nullish coalescing */}
                <h3 className="text-2xl font-bold">{(stats.averageRating ?? 0).toFixed(1)}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full dark:bg-amber-900">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Lessons</CardTitle>
            <CardDescription>Your scheduled lessons for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lessonsUpcoming > 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4 font-medium">You have {stats.lessonsUpcoming} upcoming lessons!</p>
                <Button asChild className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                    <Link href={isTeacher ? "/dashboard/teacher-bookings" : "/dashboard/upcoming-lessons"}>
                        {isTeacher ? "View All Bookings" : "View My Lessons"}
                    </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You don't have any upcoming lessons</p>
                {!isTeacher && (
                  <Button asChild className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                    <Link href="/dashboard/find-teachers">Find Teachers</Link>
                  </Button>
                )}
                {isTeacher && (
                  <Button asChild className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                    <Link href="/dashboard/schedule">Set Your Availability</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isTeacher ? "Teaching Stats" : "Learning Progress"}</CardTitle>
            <CardDescription>
              {isTeacher ? "Your teaching activity overview" : "Your language learning journey"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Hours Completed</span>
                <span className="font-bold">{(stats.totalHours ?? 0).toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-[#8B5A2B] h-2.5 rounded-full"
                  style={{ width: `${Math.min((stats.totalHours ?? 0) * 10, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-medium">Languages</span>
                <span className="font-bold">{(stats.languagesCount ?? 0)}</span>
              </div>
              <div className="flex gap-2">
                {(stats.languagesCount ?? 0) === 0 && (
                  <p className="text-sm text-gray-500">No languages added yet</p>
                )}
                {/* Potentially map through actual languages here if API provides them */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
