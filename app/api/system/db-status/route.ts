import { NextResponse } from "next/server"
import { checkDatabaseHealth } from "@/lib/db-check"

export async function GET() {
  try {
    const dbStatus = await checkDatabaseHealth()

    return NextResponse.json(dbStatus)
  } catch (error) {
    console.error("Error checking database status:", error)
    return NextResponse.json(
      {
        isConnected: false,
        error: (error as Error).message,
        tables: [],
      },
      { status: 500 },
    )
  }
}
