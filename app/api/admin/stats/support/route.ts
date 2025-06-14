import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const token = await auth.getAuthCookie()
    const session = token ? auth.verifyToken(token) : null

    if (!session || session.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get open support tickets
    const result = await db.rawQuery(`
      SELECT COUNT(*) as count 
      FROM support_tickets 
      WHERE status = 'open'
    `)

    const openTickets = Number.parseInt(result.rows[0]?.count, 10) || 0

    return NextResponse.json({
      openTickets,
    })
  } catch (error) {
    console.error("[ADMIN_SUPPORT_STATS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
