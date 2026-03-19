import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function getAdminUserFromRequest(request: Request) {
  const token = await auth.getAuthCookie()
  let user: any = token ? auth.verifyToken(token) : null

  if (!user) {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")
    if (userId && userRole === "admin") {
      user = { id: userId, role: userRole }
    }
  }

  return user
}

async function insertTicketWithFallback(userId: string, subject: string, message: string, adminId: string) {
  const attempts: Array<{ sql: string; params: any[] }> = [
    {
      sql: `INSERT INTO support_tickets (user_id, subject, description, category, priority, status, assigned_to)
            VALUES ($1, $2, $3, 'general', 'medium', 'in_progress', $4)
            RETURNING id`,
      params: [userId, subject, message, adminId],
    },
    {
      sql: `INSERT INTO support_tickets (user_id, subject, description, category, priority, status)
            VALUES ($1, $2, $3, 'general', 'medium', 'in_progress')
            RETURNING id`,
      params: [userId, subject, message],
    },
    {
      sql: `INSERT INTO support_tickets (user_id, subject, message, status)
            VALUES ($1, $2, $3, 'in_progress')
            RETURNING id`,
      params: [userId, subject, message],
    },
    {
      sql: `INSERT INTO support_tickets (user_id, subject, message)
            VALUES ($1, $2, $3)
            RETURNING id`,
      params: [userId, subject, message],
    },
  ]

  let lastError: unknown = null
  for (const attempt of attempts) {
    try {
      const result = await db.rawQuery(attempt.sql, attempt.params)
      const ticketId = result.rows[0]?.id
      if (ticketId) return ticketId
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to create support ticket")
}

async function insertMessageWithFallback(ticketId: string, adminId: string, message: string) {
  const attempts: Array<{ sql: string; params: any[] }> = [
    {
      sql: `INSERT INTO support_ticket_messages (ticket_id, sender_id, message, is_admin_reply)
            VALUES ($1, $2, $3, true)`,
      params: [ticketId, adminId, message],
    },
    {
      sql: `INSERT INTO support_ticket_messages (ticket_id, sender_id, message, is_admin)
            VALUES ($1, $2, $3, true)`,
      params: [ticketId, adminId, message],
    },
    {
      sql: `INSERT INTO support_ticket_messages (ticket_id, sender_id, message)
            VALUES ($1, $2, $3)`,
      params: [ticketId, adminId, message],
    },
  ]

  for (const attempt of attempts) {
    try {
      await db.rawQuery(attempt.sql, attempt.params)
      return
    } catch {
      // Try next schema variant.
    }
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminUserFromRequest(request)

    if (!admin || admin.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const userId = String(body?.userId || "").trim()
    const subject = String(body?.subject || "").trim()
    const message = String(body?.message || "").trim()

    if (!userId || !subject || !message) {
      return NextResponse.json({ error: "userId, subject, and message are required" }, { status: 400 })
    }

    const userCheck = await db.rawQuery("SELECT id, role FROM users WHERE id::text = $1::text", [userId])
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const targetRole = String(userCheck.rows[0]?.role || "").toLowerCase()
    if (targetRole === "admin") {
      return NextResponse.json({ error: "Messaging admin accounts is not allowed from this action" }, { status: 400 })
    }

    const ticketId = await insertTicketWithFallback(userId, subject, message, String(admin.id))
    if (ticketId) {
      await insertMessageWithFallback(String(ticketId), String(admin.id), message)
    }

    return NextResponse.json({ success: true, ticketId }, { status: 201 })
  } catch (error) {
    console.error("Admin send message API error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
