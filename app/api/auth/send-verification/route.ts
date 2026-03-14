import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { email, type = "verification" } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const usersResult = await db.rawQuery("SELECT id, email_verified FROM users WHERE email = $1", [email])
    if (usersResult.rows.length === 0) {
      // Don't reveal if email exists
      return NextResponse.json({ message: "If that email exists, a code has been sent" })
    }

    const user = usersResult.rows[0]
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing codes for this user
    await db.rawQuery("DELETE FROM verification_codes WHERE user_id = $1 AND type = $2", [user.id, type])

    // Insert new code
    await db.rawQuery(
      "INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES ($1, $2, $3, $4)",
      [user.id, code, type, expiresAt]
    )

    // Send email
    await sendVerificationEmail(email, code)

    return NextResponse.json({ message: "Verification code sent" })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
