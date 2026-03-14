import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { email, code, type = "verification" } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }

    // Find the user
    const usersResult = await db.rawQuery("SELECT id FROM users WHERE email = $1", [email])
    if (usersResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }

    const user = usersResult.rows[0]

    // Check the code
    const codesResult = await db.rawQuery(
      "SELECT id FROM verification_codes WHERE user_id = $1 AND code = $2 AND type = $3 AND expires_at > NOW()",
      [user.id, code, type]
    )

    if (codesResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    // Delete the used code
    await db.rawQuery("DELETE FROM verification_codes WHERE id = $1", [codesResult.rows[0].id])

    // If verification type, mark email as verified
    if (type === "verification") {
      await db.rawQuery("UPDATE users SET email_verified = true WHERE id = $1", [user.id])
    }

    return NextResponse.json({ message: "Code verified", userId: user.id })
  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 })
  }
}
