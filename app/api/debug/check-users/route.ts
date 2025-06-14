import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    // Check if users table exists
    const tableCheck = await db.rawQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `)

    const usersTableExists = tableCheck.rows[0].exists

    if (!usersTableExists) {
      return NextResponse.json({
        error: "Users table does not exist",
        databaseConnected: true,
        usersTableExists: false,
      })
    }

    // Get users
    const result = await db.rawQuery("SELECT * FROM users ORDER BY created_at DESC")

    return NextResponse.json({
      databaseConnected: true,
      usersTableExists: true,
      userCount: result.rows.length,
      users: result.rows,
    })
  } catch (error) {
    console.error("Error checking users:", error)
    return NextResponse.json(
      {
        error: String(error),
        databaseConnected: false,
      },
      { status: 500 },
    )
  }
}
