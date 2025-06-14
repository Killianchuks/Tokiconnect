import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { SecurityUtils } from "@/lib/security-utils"
import { emailService } from "@/lib/email-service"

// Rate limiter for forgot password requests
const rateLimiter = SecurityUtils.createRateLimiter()

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get client IP for rate limiting from request headers
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown"

    console.log(`🔐 Processing forgot password request from IP: ${clientIP}`)

    // Rate limiting
    if (!rateLimiter.isAllowed(clientIP)) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(clientIP) / 1000 / 60)
      console.warn(`🚫 Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        {
          error: `Too many password reset attempts. Please try again in ${remainingTime} minutes.`,
        },
        { status: 429 },
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ Invalid request format:", error)
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const { email } = body

    // Input validation
    if (!email || typeof email !== "string") {
      console.error("❌ Email is required")
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Sanitize and validate email
    const sanitizedEmail = SecurityUtils.sanitizeEmail(email)
    if (!SecurityUtils.validateEmail(sanitizedEmail)) {
      console.error("❌ Invalid email format:", sanitizedEmail)
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    console.log(`🔐 Processing forgot password request for: ${sanitizedEmail}`)

    // Test database connection
    try {
      const dbTest = await db.testConnection()
      if (!dbTest.success) {
        console.error("❌ Database connection failed:", dbTest.error)
        return NextResponse.json(
          {
            error: "Database service temporarily unavailable. Please try again in a few minutes.",
          },
          { status: 503 },
        )
      }
      console.log("✅ Database connection verified")
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database service temporarily unavailable. Please try again in a few minutes.",
        },
        { status: 503 },
      )
    }

    // Check if user exists
    let user
    try {
      user = await db.users.findByEmail(sanitizedEmail)
      console.log(`✅ User lookup completed for: ${sanitizedEmail}`)
    } catch (dbError) {
      console.error("❌ Database error during user lookup:", dbError)
      // For security, always return success message
      return NextResponse.json({
        message: "If an account with that email exists, we've sent you a password reset link.",
      })
    }

    if (!user) {
      console.log(`⚠️ Password reset requested for non-existent email: ${sanitizedEmail}`)
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        message: "If an account with that email exists, we've sent you a password reset link.",
      })
    }

    // Check if user account is active (using your schema's is_active field)
    if (!user.is_active || user.status === "suspended" || user.status === "deleted") {
      console.log(`⚠️ Password reset requested for inactive account: ${sanitizedEmail}`)
      return NextResponse.json({
        message: "If an account with that email exists, we've sent you a password reset link.",
      })
    }

    // Generate secure reset token
    const resetToken = SecurityUtils.generateResetToken()
    const resetTokenExpiry = SecurityUtils.generateTokenExpiry()

    console.log(`✅ Generated reset token for user ID: ${user.id}`)

    // Store reset token in database
    try {
      await db.users.setResetToken(user.id, resetToken, resetTokenExpiry)
      console.log(`✅ Reset token stored successfully for user ID: ${user.id}`)
    } catch (dbError) {
      console.error("❌ Error storing reset token:", dbError)
      return NextResponse.json({ error: "Failed to process request. Please try again." }, { status: 500 })
    }

    // Create full name from first_name and last_name
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "User"

    // Send password reset email
    try {
      const emailSent = await emailService.sendPasswordResetEmail(sanitizedEmail, resetToken, fullName)

      if (!emailSent) {
        console.error("❌ Failed to send password reset email")
        // Don't fail the request, but log the error
      } else {
        console.log(`✅ Password reset email sent successfully to: ${sanitizedEmail}`)
      }
    } catch (emailError) {
      console.error("❌ Error sending password reset email:", emailError)
      // Don't fail the request if email fails
    }

    // Log successful request
    const duration = Date.now() - startTime
    console.log(`✅ Forgot password request completed in ${duration}ms for: ${sanitizedEmail}`)

    // Always return success message for security
    return NextResponse.json({
      message: "If an account with that email exists, we've sent you a password reset link.",
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ Forgot password error after ${duration}ms:`, error)

    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
