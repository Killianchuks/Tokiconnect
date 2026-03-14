import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Get table structure for users table
    const tableInfo = await db.rawQuery(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'users'`,
      [],
    )

    // Get all tables in the database
    const tables = await db.rawQuery(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`,
      [],
    )

    return NextResponse.json({
      success: true,
      tables: tables.rows,
      usersTableStructure: tableInfo.rows,
    })
  } catch (error) {
    console.error("Error fetching database schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch database schema",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
