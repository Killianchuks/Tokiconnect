import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Check if the users table exists and has the expected structure
    const usersTable = await db.rawQuery(
      `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `,
      [],
    )

    // Check if the database has any users
    const userCount = await db.rawQuery(
      `
      SELECT COUNT(*) as count FROM users
    `,
      [],
    )

    return NextResponse.json({
      success: true,
      message: "Database tables checked",
      usersTable: {
        structure: usersTable.rows,
        count: userCount.rows[0].count,
      },
    })
  } catch (error) {
    console.error("Error checking database tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check database tables",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
