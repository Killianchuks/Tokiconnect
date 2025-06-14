import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // First, determine the database type
    let dbType = "unknown"
    try {
      // Try PostgreSQL-specific query
      const pgResult = await db.rawQuery("SELECT version()")
      if (pgResult.rows && pgResult.rows.length > 0) {
        dbType = "postgres"
      }
    } catch (e) {
      // If that fails, try SQLite-specific query
      try {
        const sqliteResult = await db.rawQuery("PRAGMA database_list")
        if (sqliteResult.rows && sqliteResult.rows.length > 0) {
          dbType = "sqlite"
        }
      } catch (innerError) {
        console.error("Could not determine database type:", innerError)
      }
    }

    console.log("Detected database type:", dbType)

    // Check if the users table exists - using database-specific queries
    let usersTableExists = false
    let tableStructure = []
    let sampleUser = null
    let columnNames = []

    if (dbType === "postgres") {
      // PostgreSQL query to check if table exists
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `
      const tableCheck = await db.rawQuery(tableCheckQuery)
      usersTableExists = tableCheck.rows && tableCheck.rows.length > 0 && tableCheck.rows[0].exists

      if (usersTableExists) {
        // Get table structure for PostgreSQL
        const structureQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users'
        `
        const structure = await db.rawQuery(structureQuery)
        tableStructure = structure.rows || []
        columnNames = tableStructure.map((col: any) => col.column_name)

        // Get a sample user
        const sampleQuery = `SELECT * FROM users LIMIT 1`
        const sampleResult = await db.rawQuery(sampleQuery)
        sampleUser = sampleResult.rows?.[0] || null
      }
    } else if (dbType === "sqlite") {
      // SQLite query to check if table exists
      const tableCheckQuery = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'
      `
      const tableCheck = await db.rawQuery(tableCheckQuery)
      usersTableExists = tableCheck.rows && tableCheck.rows.length > 0

      if (usersTableExists) {
        // Get table structure for SQLite
        const structureQuery = `PRAGMA table_info(users)`
        const structure = await db.rawQuery(structureQuery)
        tableStructure = structure.rows || []
        columnNames = tableStructure.map((col: any) => col.name)

        // Get a sample user
        const sampleQuery = `SELECT * FROM users LIMIT 1`
        const sampleResult = await db.rawQuery(sampleQuery)
        sampleUser = sampleResult.rows?.[0] || null
      }
    } else {
      // Unknown database type
      return NextResponse.json({
        success: false,
        message: "Could not determine database type",
        dbType,
      })
    }

    if (!usersTableExists) {
      return NextResponse.json({
        success: false,
        message: "Users table does not exist",
        dbType,
      })
    }

    // Sanitize the sample user to remove sensitive information
    const sanitizedSampleUser = sampleUser
      ? {
          ...Object.fromEntries(Object.entries(sampleUser).filter(([key]) => key !== "password")),
        }
      : null

    return NextResponse.json({
      success: true,
      message: "Schema check completed",
      dbType,
      tableExists: usersTableExists,
      tableStructure,
      sampleUser: sanitizedSampleUser,
      columnNames,
    })
  } catch (error) {
    console.error("Schema check error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error checking schema",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}