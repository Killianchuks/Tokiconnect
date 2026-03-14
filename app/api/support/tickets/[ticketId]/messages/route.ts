import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET - Fetch messages for a ticket
export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params

    const query = `
      SELECT 
        m.*,
        u.first_name,
        u.last_name,
        u.role as user_role
      FROM support_ticket_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.ticket_id = $1
      ORDER BY m.created_at ASC
    `
    const result = await db.rawQuery(query, [ticketId])

    return NextResponse.json({ messages: result.rows })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST - Add a message to a ticket
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const body = await request.json()
    const { senderId, message, isAdminReply } = body

    if (!senderId || !message) {
      return NextResponse.json(
        { error: "Sender ID and message are required" },
        { status: 400 }
      )
    }

    // Insert message
    const messageQuery = `
      INSERT INTO support_ticket_messages (ticket_id, sender_id, message, is_admin_reply)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const messageResult = await db.rawQuery(messageQuery, [
      ticketId,
      senderId,
      message,
      isAdminReply || false
    ])

    // Update ticket's updated_at timestamp
    // If admin replies, set status to in_progress if it was open
    if (isAdminReply) {
      await db.rawQuery(
        `UPDATE support_tickets SET updated_at = NOW(), status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END WHERE id = $1`,
        [ticketId]
      )
    } else {
      await db.rawQuery(
        `UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`,
        [ticketId]
      )
    }

    return NextResponse.json({ message: messageResult.rows[0] }, { status: 201 })
  } catch (error) {
    console.error("Error adding message:", error)
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 })
  }
}
