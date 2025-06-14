import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const token = await auth.getAuthCookie()
    const session = token ? auth.verifyToken(token) : null

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.id
    const userRole = session.role

    if (userRole !== "teacher") {
      return NextResponse.json({ error: "Only teachers can access their reviews" }, { status: 403 })
    }

    // In a real application, fetch reviews from the database
    // For now, we'll return mock data
    const mockReviews = [
      {
        id: "1",
        studentName: "Alex Johnson",
        studentId: "student1",
        rating: 5,
        date: "2025-04-01",
        comment: "Excellent teacher! Very patient and explains concepts clearly.",
        language: "Spanish",
        lessonId: "lesson1",
      },
      {
        id: "2",
        studentName: "Jamie Smith",
        studentId: "student2",
        rating: 4,
        date: "2025-03-28",
        comment: "Great lesson, I learned a lot. Looking forward to our next session.",
        language: "Spanish",
        lessonId: "lesson2",
      },
      {
        id: "3",
        studentName: "Taylor Wong",
        studentId: "student3",
        rating: 5,
        date: "2025-03-15",
        comment: "Amazing teacher! Makes learning fun and engaging.",
        language: "Spanish",
        lessonId: "lesson3",
      },
    ]

    // Calculate average rating
    const totalRating = mockReviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = mockReviews.length > 0 ? totalRating / mockReviews.length : 0

    return NextResponse.json({
      reviews: mockReviews,
      averageRating,
      totalReviews: mockReviews.length,
    })
  } catch (error) {
    console.error("Error fetching teacher reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
