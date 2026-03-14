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

        if (!userId || !teacherId) {
          throw new Error("Missing required metadata: userId or teacherId")
        }

        // Calculate times
        const startTime = lessonDate ? new Date(lessonDate) : new Date()
        const endTime = lessonDate
          ? new Date(new Date(lessonDate).getTime() + Number.parseInt(lessonDuration || "60") * 60000)
          : new Date(new Date().getTime() + 60 * 60000)

        // Amount with null check
        const amount = (session.amount_total ?? 0) / 100
        const durationMinutes = Number.parseInt(lessonDuration || "60")
        
        // Calculate platform fee (15%) and teacher earnings (85%)
        const platformFee = amount * 0.15
        const teacherEarnings = amount * 0.85

        // Create a new lesson record using raw SQL
        await db.rawQuery(
          `INSERT INTO lessons (
            teacher_id, student_id, status, type, start_time, end_time, 
            duration_minutes, payment_id, payment_status, amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
          ],
        )

        // Create a transaction record using raw SQL
        await db.rawQuery(
          `INSERT INTO transactions (
            user_id, teacher_id, amount, platform_fee, teacher_earnings, type, status, payment_id, stripe_payment_intent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [userId, teacherId, amount, platformFee, teacherEarnings, "lesson", "completed", session.id, session.payment_intent],
        )

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
