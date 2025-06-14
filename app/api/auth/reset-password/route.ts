import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Find user with valid reset token
    let user
    try {
      const result = await db.rawQuery("SELECT id, email, reset_token_expiry FROM users WHERE reset_token = $1", [
        token,
      ])
      user = result.rows[0]
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Check if token has expired
    if (new Date() > new Date(user.reset_token_expiry)) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password and clear reset token
    try {
      await db.rawQuery("UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2", [
        hashedPassword,
        user.id,
      ])
    } catch (dbError) {
      console.error("Error updating password:", dbError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Password has been reset successfully",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
