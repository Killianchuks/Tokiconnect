import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    console.log("Listing all users in the database")

    const result = await db.rawQuery("SELECT * FROM users")

    console.log(`Found ${result.rows.length} users in the database`)

    // Return a simplified version for debugging
    const users = result.rows.map((user) => ({
      id: user.id,
      email: user.email,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      role: user.role,
      active: user.is_active,
    }))

    return NextResponse.json({
      count: users.length,
      users,
    })
  } catch (error) {
    console.error("Error listing users:", error)
    return NextResponse.json(
      {
        error: "Failed to list users",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
