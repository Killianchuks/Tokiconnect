import { NextResponse } from "next/server"
import stripe from "@/lib/stripe"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const token = await auth.getAuthCookie()
    const session = token ? auth.verifyToken(token) : null

    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teacherId, lessonType, lessonDate, lessonDuration, amount } = await request.json()

    // Validate required fields
    if (!teacherId || !lessonType || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get teacher information
    const result = await db.rawQuery(
      'SELECT first_name as "firstName", last_name as "lastName", email FROM users WHERE id = $1',
      [teacherId],
    )

    const teacher = result.rows[0]

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Create a Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${lessonType} with ${teacher.firstName} ${teacher.lastName}`,
              description: `${lessonDuration} minute lesson${lessonDate ? ` on ${lessonDate}` : ""}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.id,
        teacherId,
        lessonType,
        lessonDate: lessonDate || "",
        lessonDuration: lessonDuration || "",
      },
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/payment-canceled`,
    })

    return NextResponse.json({ checkoutUrl: checkoutSession.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
