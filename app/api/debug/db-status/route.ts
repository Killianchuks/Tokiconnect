import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    const connectionResult = await db.testConnection()

    if (!connectionResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: connectionResult.message,
          error: connectionResult.error,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    // Check if users table exists and get its structure
    try {
      // Check if table exists
      const tableCheck = await db.rawQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'users'
        )
      `)

      const usersTableExists = tableCheck.rows[0].exists

      let tableStructure = null
      if (usersTableExists) {
        // Get table structure
        const columnsInfo = await db.rawQuery(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'users'
          ORDER BY ordinal_position
        `)

        tableStructure = columnsInfo.rows
      }

      return NextResponse.json({
        success: true,
        message: "Database connection successful",
        usersTableExists,
        tableStructure,
        databaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:]*@/, ":****@") : "Not set",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connected but failed to check tables",
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check database status",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
