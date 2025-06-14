import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Try to detect database type
    let dbType = "unknown"
    let version = "unknown"
    
    try {
      // Try PostgreSQL-specific query
      const pgResult = await db.rawQuery("SELECT version()")
      if (pgResult.rows && pgResult.rows[0]) {
        dbType = "PostgreSQL"
        version = pgResult.rows[0].version
      }
    } catch (pgError) {
      console.log("Not PostgreSQL:", pgError)
      
      try {
        // Try SQLite-specific query
        const sqliteResult = await db.rawQuery("SELECT sqlite_version()")
        if (sqliteResult.rows && sqliteResult.rows[0]) {
          dbType = "SQLite"
          version = Object.values(sqliteResult.rows[0])[0] as string
        }
      } catch (sqliteError) {
        console.log("Not SQLite either:", sqliteError)
      }
    }

    // Test basic connection
    const connectionTest = await db.testConnection?.() || {
      success: false,
      message: "Test connection method not available"
    }

    return NextResponse.json({
      success: true,
      dbType,
      version,
      connectionTest,
      databaseUrl: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.replace(/:[^:]*@/, ":****@") : // Hide password
        "Not set"
    })
  } catch (error) {
    console.error("Database type detection error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error detecting database type",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}