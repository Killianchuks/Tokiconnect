import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { email, code, action } = await request.json()

    if (action === "verify") {
      // Verify email with code
      if (!email || !code) {
        return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
      }

      // Find user by email
      const usersResult = await db.rawQuery("SELECT id, email_verified FROM users WHERE email = $1", [email])
      
      if (usersResult.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const user = usersResult.rows[0]

      // Check if already verified
      if (user.email_verified) {
        return NextResponse.json({ message: "Email already verified", alreadyVerified: true })
      }

      // Check verification code
      const codesResult = await db.rawQuery(
        "SELECT id FROM verification_codes WHERE user_id = $1 AND code = $2 AND type = 'email_verification' AND expires_at > NOW()",
        [user.id, code]
      )

      if (codesResult.rows.length === 0) {
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
      }

      // Update user as verified
      await db.rawQuery("UPDATE users SET email_verified = true, status = 'active' WHERE id = $1", [user.id])
      
      // Delete used verification code
      await db.rawQuery("DELETE FROM verification_codes WHERE id = $1", [codesResult.rows[0].id])

      return NextResponse.json({ 
        success: true, 
        message: "Email verified successfully" 
      })
    }

    if (action === "resend") {
      // Resend verification code
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 })
      }

      // Find user by email
      const usersResult = await db.rawQuery("SELECT id, email_verified FROM users WHERE email = $1", [email])
      
      if (usersResult.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const user = usersResult.rows[0]

      // Check if already verified
      if (user.email_verified) {
        return NextResponse.json({ message: "Email already verified", alreadyVerified: true })
      }

      // Generate new verification code
      const verificationCode = generateCode()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Delete old codes and insert new one
      await db.rawQuery("DELETE FROM verification_codes WHERE user_id = $1 AND type = 'email_verification'", [user.id])
      await db.rawQuery(
        "INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES ($1, $2, $3, $4)",
        [user.id, verificationCode, "email_verification", expiresAt]
      )

      // Send verification email
      const emailSent = await sendVerificationEmail(email, verificationCode)
      
      if (!emailSent) {
        return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: "Verification code sent" 
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
