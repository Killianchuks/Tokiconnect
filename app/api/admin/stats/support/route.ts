import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Try cookie-based auth first
    const token = await auth.getAuthCookie()
    let session = token ? auth.verifyToken(token) : null

    // Fall back to header-based auth for localStorage users
    if (!session) {
      const userId = request.headers.get("x-user-id")
      const userRole = request.headers.get("x-user-role")
      if (userId && userRole === "admin") {
        session = { id: userId, role: userRole }
      }
    }

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
