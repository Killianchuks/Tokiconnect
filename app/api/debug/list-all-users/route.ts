import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    console.log("Fetching all users from database...")

    // Simple query to get all users
    const result = await db.rawQuery("SELECT * FROM users")

    console.log(`Found ${result.rows.length} users in database`)

    // Return basic info about users
    const users = result.rows.map((user) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active,
    }))

    return NextResponse.json({
      count: users.length,
      users: users,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
