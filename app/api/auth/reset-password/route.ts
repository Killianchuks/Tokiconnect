import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password-utils"
import { sendPasswordResetEmail } from "@/lib/email"

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { email, code, newPassword, action } = await request.json()

    if (action === "request") {
      // Request password reset
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 })
      }

      // Check if user exists (case-insensitive)
      const normalizedEmail = email.toLowerCase().trim()
      
      let usersResult
      try {
        usersResult = await db.rawQuery("SELECT id, email FROM users WHERE LOWER(email) = $1", [normalizedEmail])
      } catch (dbError) {
        console.error("Database error looking up user:", dbError)
        return NextResponse.json({ error: "Database error. Please try again." }, { status: 500 })
      }
      
      if (!usersResult || usersResult.rows.length === 0) {
        // Don't reveal if email exists - return success to prevent enumeration
        return NextResponse.json({ message: "If that email exists, a reset code has been sent" })
      }

      const user = usersResult.rows[0]
      const resetCode = generateCode()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Delete any existing codes for this user and insert new one
      try {
        await db.rawQuery("DELETE FROM verification_codes WHERE user_id = $1 AND type = 'password_reset'", [user.id])
        await db.rawQuery(
          "INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES ($1, $2, $3, $4)",
          [user.id, resetCode, "password_reset", expiresAt]
        )
      } catch (codeError) {
        console.error("Error storing reset code:", codeError)
        return NextResponse.json({ error: "Failed to generate reset code. Please try again." }, { status: 500 })
      }

      // Send email
      console.log("[v0] Sending password reset email to:", user.email)
      const emailSent = await sendPasswordResetEmail(user.email, resetCode)
      console.log("[v0] Email sent result:", emailSent)

      if (!emailSent) {
        return NextResponse.json({ error: "Failed to send reset email. Please check that your email service is configured correctly." }, { status: 500 })
      }

      return NextResponse.json({ message: "Password reset code sent" })
    }

    if (action === "reset") {
      // Reset password with code
      if (!email || !code || !newPassword) {
        return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 })
      }

      const usersResult = await db.rawQuery("SELECT id FROM users WHERE email = $1", [email])
      if (usersResult.rows.length === 0) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 })
      }

      const user = usersResult.rows[0]

      const codesResult = await db.rawQuery(
        "SELECT id FROM verification_codes WHERE user_id = $1 AND code = $2 AND type = 'password_reset' AND expires_at > NOW()",
        [user.id, code]
      )

      if (codesResult.rows.length === 0) {
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
      }

      const hashedPassword = await hashPassword(newPassword)
      await db.rawQuery("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, user.id])
      await db.rawQuery("DELETE FROM verification_codes WHERE id = $1", [codesResult.rows[0].id])

      return NextResponse.json({ message: "Password reset successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
