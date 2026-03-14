import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { db } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Extract fields with fallbacks
    const firstName = body.firstName || ""
    const lastName = body.lastName || ""
    const email = body.email?.toLowerCase().trim() || ""
    const password = body.password || ""
    const role = body.role || "student"

    // Additional fields for teachers
    const language = body.language || null
    const hourlyRate = body.hourlyRate || null
    const bio = body.bio || null

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await db.rawQuery("SELECT id FROM users WHERE LOWER(email) = $1", [email])

    if (existingUser.rows && existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 },
      )
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create user
    const query = `
      INSERT INTO users (
        email, 
        first_name, 
        last_name, 
        name,
        password, 
        role,
        language,
        hourly_rate,
        bio,
        status,
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
      RETURNING id, email, first_name, last_name, role
    `

    const result = await db.rawQuery(query, [
      email,
      firstName || "User",
      lastName || "",
      `${firstName || "User"} ${lastName || ""}`.trim(),
      hashedPassword,
      role,
      role === "teacher" ? language : null,
      role === "teacher" ? hourlyRate : null,
      role === "teacher" ? bio : null,
      "active",
    ])

    const newUser = result.rows[0]

    // Generate verification code
    const verificationCode = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store verification code
    try {
      await db.rawQuery(
        "INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES ($1, $2, $3, $4)",
        [newUser.id, verificationCode, "email_verification", expiresAt]
      )
    } catch (codeError) {
      console.error("Error storing verification code:", codeError)
      // Continue without verification if table doesn't exist
    }

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode)
    
    if (!emailSent) {
      // Delete user if email fails - they need to verify to proceed
      await db.rawQuery("DELETE FROM users WHERE id = $1", [newUser.id])
      return NextResponse.json(
        { success: false, error: "Failed to send verification email. Please check your email address and try again." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Please check your email for verification code.",
        requiresVerification: true,
        userId: newUser.id,
        user: {
          id: newUser.id,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error", details: String(error) },
      { status: 500 },
    )
  }
}
