import { NextResponse } from "next/server"
import stripe from "@/lib/stripe"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const token = await auth.getAuthCookie()
    const session = token ? auth.verifyToken(token) : null

    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    // Verify that this session belongs to the current user
    if (checkoutSession.metadata?.userId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      amount: ((checkoutSession.amount_total ?? 0) / 100).toFixed(2),
      currency: checkoutSession.currency,
      paymentStatus: checkoutSession.payment_status,
      customerEmail: checkoutSession.customer_details?.email,
    })
  } catch (error) {
    console.error("Error retrieving session details:", error)
    return NextResponse.json({ error: "Failed to retrieve session details" }, { status: 500 })
  }
}
