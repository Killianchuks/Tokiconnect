import { NextResponse } from "next/server"
import stripe from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    console.log("[v0] verify-session called with sessionId:", sessionId)

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log("[v0] Stripe session retrieved:", session.payment_status, session.metadata)

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    // Extract metadata
    const metadata = session.metadata || {}
    const userId = metadata.userId
    const teacherId = metadata.teacherId
    const lessonType = metadata.lessonType
    const lessonDate = metadata.lessonDate
    const lessonDuration = metadata.lessonDuration

    if (!userId || !teacherId) {
      return NextResponse.json({ error: "Missing booking information" }, { status: 400 })
    }

    // Check if lesson already exists for this session
    const existingLesson = await db.rawQuery(
      "SELECT id FROM lessons WHERE payment_id = $1",
      [sessionId]
    )

    if (existingLesson.rows?.length > 0) {
      // Lesson already created (by webhook or previous request)
      return NextResponse.json({ 
        success: true, 
        alreadyProcessed: true,
        lessonId: existingLesson.rows[0].id 
      })
    }

    // Calculate times
    const startTime = lessonDate ? new Date(lessonDate) : new Date()
    const durationMinutes = Number.parseInt(lessonDuration || "60")
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

    // Amount
    const amount = (session.amount_total ?? 0) / 100
    const platformFee = amount * 0.15
    const teacherEarnings = amount * 0.85

    // Create the lesson
    console.log("[v0] Creating lesson with data:", { teacherId, userId, startTime: startTime.toISOString(), amount })
    const lessonResult = await db.rawQuery(
      `INSERT INTO lessons (
        teacher_id, student_id, status, type, start_time, end_time, 
        duration_minutes, payment_id, payment_status, amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        teacherId,
        userId,
        "scheduled",
        lessonType || "single",
        startTime.toISOString(),
        endTime.toISOString(),
        durationMinutes,
        sessionId,
        "paid",
        amount,
      ]
    )
    console.log("[v0] Lesson created:", lessonResult.rows?.[0])

    // Create transaction record
    await db.rawQuery(
      `INSERT INTO transactions (
        user_id, teacher_id, amount, platform_fee, teacher_earnings, type, status, payment_id, stripe_payment_intent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, teacherId, amount, platformFee, teacherEarnings, "lesson", "completed", sessionId, session.payment_intent]
    )

    return NextResponse.json({ 
      success: true, 
      lesson: lessonResult.rows[0] 
    })

  } catch (error) {
    console.error("Error verifying session:", error)
    return NextResponse.json({ 
      error: "Failed to verify session",
      details: String(error)
    }, { status: 500 })
  }
}
