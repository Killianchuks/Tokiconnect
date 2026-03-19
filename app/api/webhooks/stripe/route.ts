import { NextResponse } from "next/server"
import { headers } from "next/headers"
import stripe from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature") as string

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured" }, { status: 500 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object

        // Extract metadata with type assertion
        const metadata = (session.metadata as Record<string, string>) || {}
        const userId = metadata.userId
        const teacherId = metadata.teacherId
        const lessonType = metadata.lessonType
        const lessonDate = metadata.lessonDate
        const lessonDuration = metadata.lessonDuration
        const lessonStartTime = metadata.lessonStartTime
        const lessonEndTime = metadata.lessonEndTime
        const userTimezone = metadata.userTimezone

        if (!userId || !teacherId) {
          throw new Error("Missing required metadata: userId or teacherId")
        }

        // Calculate times
        let startTime = lessonStartTime ? new Date(lessonStartTime) : lessonDate ? new Date(lessonDate) : new Date()
        if (isNaN(startTime.getTime())) {
          console.warn("Invalid webhook startTime, falling back to soon", { lessonStartTime, lessonDate })
          startTime = new Date(Date.now() + 60000)
        }

        let endTime: Date
        if (lessonEndTime) {
          endTime = new Date(lessonEndTime)
        } else {
          const durationMinutes = Number.parseInt(lessonDuration || "60")
          endTime = new Date(startTime.getTime() + (isNaN(durationMinutes) ? 60 : durationMinutes) * 60000)
        }

        if (isNaN(endTime.getTime())) {
          console.warn("Invalid webhook endTime, using startTime + 60min", { lessonEndTime, startTime })
          endTime = new Date(startTime.getTime() + 60 * 60000)
        }

        // Amount with null check
        const amount = (session.amount_total ?? 0) / 100
        const durationMinutes = Number.parseInt(lessonDuration || "60")
        
        // Calculate platform fee (15%) and teacher earnings (85%)
        const platformFee = amount * 0.15
        const teacherEarnings = amount * 0.85

        // Create a new lesson record only if this Stripe session has not been processed yet
        const existingLessonResult = await db.rawQuery(
          `SELECT id FROM lessons WHERE payment_id::text = $1::text LIMIT 1`,
          [session.id],
        )

        if (existingLessonResult.rows.length === 0) {
          await db.rawQuery(
            `INSERT INTO lessons (
              teacher_id, student_id, status, type, start_time, end_time, 
              duration_minutes, payment_id, payment_status, amount, notes, student_timezone
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              teacherId,
              userId,
              "scheduled",
              lessonType || "single",
              startTime.toISOString(),
              endTime.toISOString(),
              durationMinutes,
              session.id,
              "paid",
              amount,
              JSON.stringify({
                timezone: userTimezone || null,
                requestedStart: lessonStartTime || null,
                requestedEnd: lessonEndTime || null,
              }),
              userTimezone || null,
            ],
          )
        }

        // Create a transaction record only once per Stripe session
        const existingTransactionResult = await db.rawQuery(
          `SELECT id FROM transactions WHERE payment_id::text = $1::text LIMIT 1`,
          [session.id],
        )

        if (existingTransactionResult.rows.length === 0) {
          await db.rawQuery(
            `INSERT INTO transactions (
              user_id, teacher_id, amount, platform_fee, teacher_earnings, type, status, payment_id, stripe_payment_intent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [userId, teacherId, amount, platformFee, teacherEarnings, "lesson", "completed", session.id, session.payment_intent],
          )
        }

        break

      case "payment_intent.succeeded":
        // Handle successful payment intent if needed
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error handling webhook event:", error)
    return NextResponse.json({ error: "Error handling webhook event" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
