import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    console.log("Debug: Listing all raw users from database")

    // Test database connection
    const connectionTest = await db.testConnection()
    console.log("Database connection test:", connectionTest)

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: connectionTest,
        },
        { status: 500 },
      )
    }

    // Direct query to list all users
    const result = await db.rawQuery("SELECT * FROM users LIMIT 100")

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    })
  } catch (error) {
    console.error("Error listing raw users:", error)
    return NextResponse.json(
      {
        error: "Failed to list users",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
