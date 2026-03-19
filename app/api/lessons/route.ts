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
      query += ` AND ((l.start_time > NOW() AND l.status IN ('scheduled', 'confirmed')) OR l.status = 'pending')`
    } else if (status === "past") {
      query += ` AND (l.start_time < NOW() OR l.status IN ('completed', 'cancelled'))`
    }

    query += ` ORDER BY l.start_time ASC`

    console.log("[v0] Lessons query:", query)
    console.log("[v0] Lessons params:", params)

    const result = await db.rawQuery(query, params)

    const rows = result.rows || []

    // Prevent duplicate lesson cards when historical race conditions created duplicates
    // for the same payment/session.
    const dedupedLessons = rows.filter((lesson: any, index: number, arr: any[]) => {
      const key = lesson.payment_id || lesson.id
      return arr.findIndex((candidate: any) => (candidate.payment_id || candidate.id) === key) === index
    })

    return NextResponse.json(dedupedLessons)
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

    // Prevent duplicate lessons by checking payment_id and lesson time
    if (paymentId) {
      const existing = await db.rawQuery(
        "SELECT id FROM lessons WHERE payment_id = $1",
        [paymentId]
      )
      if (existing.rows?.length > 0) {
        return NextResponse.json({ lesson: existing.rows[0], message: "Lesson already exists" })
      }
    }

    if (studentId && teacherId && startTime) {
      const existingTime = await db.rawQuery(
        "SELECT id FROM lessons WHERE student_id = $1 AND teacher_id = $2 AND start_time = $3",
        [studentId, teacherId, startTime]
      )
      if (existingTime.rows?.length > 0) {
        return NextResponse.json({ lesson: existingTime.rows[0], message: "Lesson already exists for this time" })
      }
    }

    // Get teacher's availability to check for meeting links
    let meetingLink = null
    try {
      const teacherAvailability = await db.rawQuery(
        `SELECT availability FROM users WHERE id::text = $1::text AND role = 'teacher'`,
        [teacherId]
      )
      
      if (teacherAvailability.rows.length > 0 && teacherAvailability.rows[0].availability) {
        const availability = teacherAvailability.rows[0].availability
        if (Array.isArray(availability)) {
          // Find the day of the week for the lesson
          const lessonDate = new Date(startTime)
          const lessonDay = lessonDate.toLocaleLowerCase('en-US', { weekday: 'long' })
          const dayAvailability = availability.find((item: any) => 
            item.day?.toLowerCase() === lessonDay
          )
          
          if (dayAvailability && dayAvailability.slots) {
            // Find the time slot that matches the lesson time
            const lessonHour = lessonDate.getHours()
            const lessonMinute = lessonDate.getMinutes()
            const lessonTimeString = `${String(lessonHour).padStart(2, '0')}:${String(lessonMinute).padStart(2, '0')}`
            
            // Check each slot to see if the lesson time falls within it
            for (const slot of dayAvailability.slots) {
              if (typeof slot === 'string') {
                // Legacy format: "9:00 - 10:00"
                const [startStr, endStr] = slot.split(' - ')
                if (startStr && endStr) {
                  const slotStart = startStr.trim()
                  const slotEnd = endStr.trim()
                  if (lessonTimeString >= slotStart && lessonTimeString < slotEnd) {
                    // This slot matches, but no meeting link in legacy format
                    break
                  }
                }
              } else if (slot.start && slot.end && slot.meetingLink) {
                // New format with meeting link
                if (lessonTimeString >= slot.start && lessonTimeString < slot.end) {
                  meetingLink = slot.meetingLink
                  break
                }
              }
            }
          }
        }
      }
    } catch (availabilityError) {
      console.warn("Failed to fetch teacher availability for meeting link:", availabilityError)
      // Continue without meeting link if availability fetch fails
    }

    // Create the lesson
    const result = await db.rawQuery(
      `INSERT INTO lessons (
        teacher_id, student_id, status, type, start_time, end_time, 
        duration_minutes, payment_id, payment_status, amount, meeting_link
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        meetingLink,
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
