import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const role = searchParams.get("role") || "student"
    const status = searchParams.get("status") // upcoming, past, all

    console.log("[v0] Lessons API GET called:", { userId, role, status })

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let query = ""
    const params: string[] = [userId]
    
    // Build query based on role
    if (role === "teacher") {
      query = `
        SELECT 
          l.*,
          u.first_name as student_first_name,
          u.last_name as student_last_name,
          u.email as student_email,
          u.profile_image as student_image
        FROM lessons l
        LEFT JOIN users u ON l.student_id = u.id::text
        WHERE l.teacher_id = $1
      `
    } else {
      query = `
        SELECT 
          l.*,
          u.first_name as teacher_first_name,
          u.last_name as teacher_last_name,
          u.email as teacher_email,
          u.profile_image as teacher_image
        FROM lessons l
        LEFT JOIN users u ON l.teacher_id = u.id::text
        WHERE l.student_id = $1
      `
    }

    // Filter by status
    if (status === "upcoming") {
      query += ` AND l.start_time > NOW() AND l.status IN ('scheduled', 'confirmed')`
    } else if (status === "past") {
      query += ` AND (l.start_time < NOW() OR l.status IN ('completed', 'cancelled'))`
    }

    query += ` ORDER BY l.start_time ASC`

    console.log("[v0] Lessons query:", query)
    console.log("[v0] Lessons params:", params)

    const result = await db.rawQuery(query, params)

    console.log("[v0] Lessons result:", result.rows?.length || 0, "rows")

    return NextResponse.json(result.rows || [])
  } catch (error) {
    console.error("Error fetching user lessons:", error)
    return NextResponse.json({ error: "Failed to fetch user lessons" }, { status: 500 })
  }
}

// POST - Create a lesson directly (fallback for when webhook doesn't fire)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      teacherId, 
      studentId, 
      startTime, 
      endTime, 
      durationMinutes,
      type,
      amount,
      paymentId,
      paymentStatus 
    } = body

    if (!teacherId || !studentId || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if lesson with this payment_id already exists
    if (paymentId) {
      const existing = await db.rawQuery(
        "SELECT id FROM lessons WHERE payment_id = $1",
        [paymentId]
      )
      if (existing.rows?.length > 0) {
        return NextResponse.json({ lesson: existing.rows[0], message: "Lesson already exists" })
      }
    }

    // Create the lesson
    const result = await db.rawQuery(
      `INSERT INTO lessons (
        teacher_id, student_id, status, type, start_time, end_time, 
        duration_minutes, payment_id, payment_status, amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        teacherId,
        studentId,
        "scheduled",
        type || "single",
        startTime,
        endTime || new Date(new Date(startTime).getTime() + (durationMinutes || 60) * 60000).toISOString(),
        durationMinutes || 60,
        paymentId || null,
        paymentStatus || "paid",
        amount || 0,
      ]
    )

    // Also create a transaction record
    if (amount && amount > 0) {
      const platformFee = amount * 0.15
      const teacherEarnings = amount * 0.85
      
      await db.rawQuery(
        `INSERT INTO transactions (
          user_id, teacher_id, amount, platform_fee, teacher_earnings, type, status, payment_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING`,
        [studentId, teacherId, amount, platformFee, teacherEarnings, "lesson", "completed", paymentId]
      )
    }

    return NextResponse.json({ lesson: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating lesson:", error)
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 })
  }
}
