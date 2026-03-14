import { NextResponse } from "next/server"
import stripe from "@/lib/stripe"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Helper to get user ID from session or query params
async function getUserId(request: Request): Promise<string | null> {
  // First try session auth
  const token = await auth.getAuthCookie()
  const session = token ? auth.verifyToken(token) : null
  if (session?.id) return session.id
  
  // Fall back to query param (for localStorage-based auth)
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  return userId
}

// GET - Retrieve user's payment methods
export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's Stripe customer ID from database
    const userResult = await db.rawQuery(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    )

    const user = userResult.rows[0]

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ paymentMethods: [], hasCustomer: false })
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: 'card',
    })

    // Get default payment method
    const customer = await stripe.customers.retrieve(user.stripe_customer_id)
    const defaultPaymentMethodId = 
      typeof customer !== 'string' && !customer.deleted 
        ? customer.invoice_settings?.default_payment_method 
        : null

    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === defaultPaymentMethodId,
    }))

    return NextResponse.json({ 
      paymentMethods: formattedMethods, 
      hasCustomer: true 
    })
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}

// POST - Create a SetupIntent for adding a new payment method
export async function POST(request: Request) {
  try {
    // Get userId from body or session
    const body = await request.json().catch(() => ({}))
    const token = await auth.getAuthCookie()
    const session = token ? auth.verifyToken(token) : null
    const userId = session?.id || body.userId

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create Stripe customer
    const userResult = await db.rawQuery(
      'SELECT stripe_customer_id, email, first_name, last_name FROM users WHERE id = $1',
      [userId]
    )

    const user = userResult.rows[0]

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let customerId = user.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || body.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || body.name || '',
        metadata: {
          userId: userId,
        },
      })

      customerId = customer.id

      // Save customer ID to database
      await db.rawQuery(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, userId]
      )
    }

    // Create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // For future payments
    })

    return NextResponse.json({ 
      clientSecret: setupIntent.client_secret,
      customerId 
    })
  } catch (error) {
    console.error("Error creating setup intent:", error)
    return NextResponse.json({ error: "Failed to create setup intent" }, { status: 500 })
  }
}

// DELETE - Remove a payment method
export async function DELETE(request: Request) {
  try {
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const paymentMethodId = body.paymentMethodId

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Payment method ID required" }, { status: 400 })
    }

    // Detach the payment method from the customer
    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing payment method:", error)
    return NextResponse.json({ error: "Failed to remove payment method" }, { status: 500 })
  }
}

// PUT - Set a payment method as default
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const token = await auth.getAuthCookie()
    const session = token ? auth.verifyToken(token) : null
    const userId = session?.id || body.userId

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Payment method ID required" }, { status: 400 })
    }

    // Get user's Stripe customer ID
    const userResult = await db.rawQuery(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    )

    const user = userResult.rows[0]

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 })
    }

    // Update the default payment method
    await stripe.customers.update(user.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting default payment method:", error)
    return NextResponse.json({ error: "Failed to set default payment method" }, { status: 500 })
  }
}
