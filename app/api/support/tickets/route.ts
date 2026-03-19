import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTicketResolvedEmail } from "@/lib/email"

// GET - Fetch tickets (for user or admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const isAdmin = searchParams.get("isAdmin") === "true"
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    let query = `
      SELECT 
        t.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role as user_role
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    // If not admin, only show user's own tickets
    if (!isAdmin && userId) {
      query += ` AND t.user_id = $${paramIndex++}`
      params.push(userId)
    }

    // Filter by status
    if (status && status !== "all") {
      query += ` AND t.status = $${paramIndex++}`
      params.push(status)
    }

    // Search
    if (search) {
      query += ` AND (t.subject ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` ORDER BY t.created_at DESC`

    const result = await db.rawQuery(query, params)

    return NextResponse.json({ tickets: result.rows })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

// POST - Create a new ticket
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, subject, description, category, priority } = body

    if (!userId || !subject || !description) {
      return NextResponse.json(
        { error: "User ID, subject, and description are required" },
        { status: 400 }
      )
    }

    // user_id is now TEXT to be flexible with different ID formats
    const query = `
      INSERT INTO support_tickets (user_id, subject, description, category, priority, status)
      VALUES ($1, $2, $3, $4, $5, 'open')
      RETURNING *
    `
    
    const result = await db.rawQuery(query, [
      userId,
      subject,
      description,
      category || "general",
      priority || "medium"
    ])

    return NextResponse.json({ ticket: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating ticket:", error)
    return NextResponse.json({ error: "Failed to create ticket", details: String(error) }, { status: 500 })
  }
}

// PUT - Update ticket status (admin only)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { ticketId, status, resolutionMessage } = body

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID required" }, { status: 400 })
    }

    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (status) {
      updates.push(`status = $${paramIndex++}`)
      params.push(status)
    }

    updates.push(`updated_at = NOW()`)

    if (updates.length === 1) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
    }

    // Add ticketId as the last parameter
    params.push(ticketId)
    const ticketIdParamIndex = paramIndex

    const query = `
      UPDATE support_tickets 
      SET ${updates.join(", ")}
      WHERE id = $${ticketIdParamIndex}
      RETURNING *
    `

    const result = await db.rawQuery(query, params)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const updatedTicket = result.rows[0]

    // If ticket is being resolved, send email notification to user
    if (status === "resolved") {
      try {
        // Get user details
        const userResult = await db.rawQuery(
          "SELECT email, first_name, last_name FROM users WHERE id = $1",
          [updatedTicket.user_id]
        )

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0]
          const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
          
          await sendTicketResolvedEmail(
            user.email,
            userName,
            updatedTicket.subject,
            updatedTicket.id,
            resolutionMessage
          )
        }
      } catch (emailError) {
        console.error("Failed to send resolution email:", emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ ticket: updatedTicket })
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
