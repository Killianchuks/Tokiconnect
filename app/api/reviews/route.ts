import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Validation schema for creating a review
const createReviewSchema = z.object({
  teacherId: z.string().uuid(),
  lessonId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

// Define interfaces for our data types
interface Review {
  id: string
  lessonId: string
  teacherId: string
  studentId: string
  rating: number
  comment: string | null
  createdAt: Date
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface Lesson {
  id: string
  teacherId: string
  studentId: string
  status: string
}

export async function POST(request: Request) {
  try {
    const token = await auth.getAuthCookie()
    const session = token ? auth.verifyToken(token) : null

    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createReviewSchema.parse(body)

    // Check if the user is a student
    if (session.role !== "student") {
      return NextResponse.json({ error: "Only students can submit reviews" }, { status: 403 })
    }

    // Check if the lesson exists and belongs to the student
    const lessonResult = await db.rawQuery(`SELECT * FROM lessons WHERE id = $1 AND student_id = $2`, [
      validatedData.lessonId,
      session.id,
    ])
    const lesson = lessonResult.rows[0]

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found or does not belong to you" }, { status: 404 })
    }

    // Check if the teacher exists
    const teacherResult = await db.rawQuery(`SELECT * FROM users WHERE id = $1 AND role = 'teacher'`, [
      validatedData.teacherId,
    ])
    const teacher = teacherResult.rows[0]

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Check if a review already exists for this lesson
    const existingReviewResult = await db.rawQuery(`SELECT * FROM reviews WHERE lesson_id = $1`, [
      validatedData.lessonId,
    ])
    const existingReview = existingReviewResult.rows[0]

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this lesson" }, { status: 409 })
    }

    // Create the review
    const newReviewResult = await db.rawQuery(
      `INSERT INTO reviews (lesson_id, teacher_id, student_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        validatedData.lessonId,
        validatedData.teacherId,
        session.id,
        validatedData.rating,
        validatedData.comment || null,
      ],
    )
    const newReview = newReviewResult.rows[0]

    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.format() }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const token = await auth.getAuthCookie()
    const session = token ? auth.verifyToken(token) : null

    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")
    const studentId = searchParams.get("studentId")

    let reviews: any[] = []
    let averageRating = 0

    if (teacherId) {
      // Get reviews for a specific teacher
      const reviewsResult = await db.rawQuery(
        `SELECT r.*, 
         s.first_name as "studentFirstName", s.last_name as "studentLastName", 
         s.email as "studentEmail", s.profile_image as "studentProfileImage",
         l.* 
         FROM reviews r
         JOIN users s ON r.student_id = s.id
         JOIN lessons l ON r.lesson_id = l.id
         WHERE r.teacher_id = $1
         ORDER BY r.created_at DESC`,
        [teacherId],
      )
      reviews = reviewsResult.rows
    } else if (studentId) {
      // Get reviews by a specific student
      const reviewsResult = await db.rawQuery(
        `SELECT r.*, 
         t.first_name as "teacherFirstName", t.last_name as "teacherLastName", 
         t.email as "teacherEmail", t.profile_image as "teacherProfileImage",
         l.* 
         FROM reviews r
         JOIN users t ON r.teacher_id = t.id
         JOIN lessons l ON r.lesson_id = l.id
         WHERE r.student_id = $1
         ORDER BY r.created_at DESC`,
        [studentId],
      )
      reviews = reviewsResult.rows
    } else {
      // Get all reviews the user has access to
      if (session.role === "teacher") {
        // Teachers can see reviews about them
        const reviewsResult = await db.rawQuery(
          `SELECT r.*, 
           s.first_name as "studentFirstName", s.last_name as "studentLastName", 
           s.email as "studentEmail", s.profile_image as "studentProfileImage",
           l.* 
           FROM reviews r
           JOIN users s ON r.student_id = s.id
           JOIN lessons l ON r.lesson_id = l.id
           WHERE r.teacher_id = $1
           ORDER BY r.created_at DESC`,
          [session.id],
        )
        reviews = reviewsResult.rows
      } else {
        // Students can see reviews they've written
        const reviewsResult = await db.rawQuery(
          `SELECT r.*, 
           t.first_name as "teacherFirstName", t.last_name as "teacherLastName", 
           t.email as "teacherEmail", t.profile_image as "teacherProfileImage",
           l.* 
           FROM reviews r
           JOIN users t ON r.teacher_id = t.id
           JOIN lessons l ON r.lesson_id = l.id
           WHERE r.student_id = $1
           ORDER BY r.created_at DESC`,
          [session.id],
        )
        reviews = reviewsResult.rows
      }
    }

    // Calculate average rating
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0)
      averageRating = totalRating / reviews.length
    }

    return NextResponse.json({
      reviews,
      averageRating,
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
