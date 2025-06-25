// app/api/payments/create-checkout/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import stripe from "@/lib/stripe"; // FIX 1: Changed to default import

export async function POST(request: NextRequest) {
  console.log("--- Payment API (POST /api/payments/create-checkout) Request Start ---");

  try {
    const userSession = await auth.getCurrentUser(request);

    if (!userSession || !userSession.id) {
      console.warn("Payment API: Unauthorized attempt to create checkout session (no user session or ID).");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestBody = await request.json();
    console.log("Payment API: Request body received:", requestBody);

    const { teacherId, lessonType, lessonDate, lessonDuration, amount, successUrl, cancelUrl } = requestBody;

    if (!teacherId || !lessonType || amount === undefined || amount === null || !successUrl || !cancelUrl) {
      console.warn("Payment API: Missing required fields for checkout session. Received:", { teacherId, lessonType, amount, successUrl, cancelUrl });
      return new NextResponse(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch teacher details to ensure they exist and get their hourly rate, etc.
    console.log(`Payment API: Fetching teacher details for ID: ${teacherId}`);
    const teacherResult = await db.rawQuery(
      `SELECT hourly_rate, free_demo_available, free_demo_duration, trial_class_available, trial_class_price
       FROM users WHERE id = $1 AND role = 'teacher'`,
      [teacherId]
    );

    console.log("Payment API: Teacher DB query result:", teacherResult.rows);

    if (teacherResult.rows.length === 0) {
      console.warn(`Payment API: Teacher not found for ID: ${teacherId}.`);
      return new NextResponse(JSON.stringify({ message: "Teacher not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teacher = teacherResult.rows[0];
    let actualAmount = parseFloat(amount); // Use the amount sent from the frontend

    // Server-side validation for free demo
    if (lessonType === "free-demo" && teacher.free_demo_available === true) {
      actualAmount = 0; // Override amount to 0 for free demo
      console.log(`Payment API: Processing free demo for teacher ${teacherId}. Amount set to 0.`);
    } else if (lessonType === "trial" && teacher.trial_class_available === true) {
        // Ensure trial class price is used if it's a trial
        actualAmount = parseFloat(teacher.trial_class_price || 0); // Use server-side trial price
        console.log(`Payment API: Processing trial class for teacher ${teacherId}. Amount set to ${actualAmount}.`);
    }

    // Prevent negative amounts if any calculation error happens, though this shouldn't be an issue
    if (actualAmount < 0) {
        actualAmount = 0;
    }

    console.log(`Payment API: Final amount for Stripe session: $${actualAmount.toFixed(2)}`);

    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${lessonType === "free-demo" ? "Free Demo Class" :
                   lessonType === "trial" ? "Trial Lesson" :
                   lessonType === "single" ? `${lessonDuration}-minute Single Lesson` :
                   "Monthly Subscription"} with ${teacherId}`, // Placeholder name
            description: `Booking with teacher ID: ${teacherId}. Date: ${lessonDate || 'N/A'}. Duration: ${lessonDuration || 'N/A'} mins.`,
            // Add image if you have a default product image for Stripe checkout
            // images: ['https://example.com/product-image.png'],
          },
          unit_amount: Math.round(actualAmount * 100), // Amount in cents
        },
        quantity: 1,
      },
    ];

    console.log("Payment API: Line items prepared for Stripe:", JSON.stringify(lineItems, null, 2));
    console.log(`Payment API: Stripe Mode: "payment"`);
    // NOTE: For security, DO NOT log your actual Stripe Secret Key here.
    // console.log(`Payment API: Stripe API Key (last 4 chars): ${process.env.STRIPE_SECRET_KEY?.slice(-4)}`);


    // Create Stripe Checkout Session
    let session;
    try {
        session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: lineItems,
          mode: "payment",
          success_url: successUrl, // Use the successUrl passed from frontend
          cancel_url: cancelUrl,   // Use the cancelUrl passed from frontend
          // You might want to pass metadata here for tracking in Stripe/your DB
          metadata: {
            userId: userSession.id,
            teacherId: teacherId,
            lessonType: lessonType,
            lessonDate: lessonDate,
            lessonDuration: lessonDuration, // Use lessonDuration here
            amount: actualAmount.toFixed(2),
          },
        });
        console.log("Payment API: Raw Stripe session object created:", JSON.stringify(session, null, 2));

    } catch (stripeError) {
        console.error("Payment API: Error creating Stripe checkout session:", (stripeError as Error).message);
        console.error("Payment API: Stripe Error details (if available):", JSON.stringify(stripeError, null, 2));
        // Re-throw or return a more specific error for the frontend
        return new NextResponse(JSON.stringify({ message: "Failed to create Stripe checkout session", details: (stripeError as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }


    if (session && session.url) {
        console.log(`Payment API: Successfully created checkout session with URL: ${session.url} for user ${userSession.id}.`);
        return NextResponse.json({ checkoutUrl: session.url });
    } else {
        console.error("Payment API: Stripe session created, but no URL found. Session object:", JSON.stringify(session, null, 2));
        return new NextResponse(JSON.stringify({ message: "Failed to obtain checkout URL from Stripe." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error("Payment API: Unexpected error during checkout session creation:", error);
    return new NextResponse(JSON.stringify({ message: "An unexpected error occurred during payment processing.", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    console.log("--- Payment API (POST /api/payments/create-checkout) Request End ---");
  }
}