import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { sendNewMessageEmail } from "@/lib/email"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    const userId = request.nextUrl.searchParams.get("userId")

    const query = `
      SELECT
        m.id,
        m.content,
        m.sender_id as "senderId",
        m.receiver_id as "receiverId",
        m.created_at as "createdAt",
        u.first_name as "senderFirstName",
        u.last_name as "senderLastName",
        u.profile_image as "senderProfileImage"
      FROM messages m
      LEFT JOIN users u ON u.id::text = m.sender_id::text
      WHERE m.lesson_id::text = $1::text
      ORDER BY m.created_at ASC
    `

    const result = await db.rawQuery(query, [conversationId])
    const messages = (result.rows || []).map((row: any) => ({
      id: row.id,
      content: row.content,
      senderId: row.senderId,
      senderName: `${row.senderFirstName || ""} ${row.senderLastName || ""}`.trim(),
      senderAvatar: row.senderProfileImage,
      timestamp: row.createdAt,
    }))

    // Mark messages as read for this user if userId is provided
    if (userId) {
      await db.rawQuery(
        `UPDATE messages SET is_read = true WHERE lesson_id::text = $1::text AND receiver_id::text = $2::text AND is_read = false`,
        [conversationId, userId],
      )
    }

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error("Error fetching conversation messages:", error)
    return NextResponse.json({ error: error?.message || "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const body = await request.json()
    const { userId, content } = body

    if (!conversationId || !userId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the user is part of the lesson (student or teacher)
    const lessonResult = await db.rawQuery(
      `SELECT student_id, teacher_id FROM lessons WHERE id::text = $1`,
      [conversationId]
    )

    if (lessonResult.rows.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const lesson = lessonResult.rows[0]
    const isStudent = String(lesson.student_id) === String(userId)
    const isTeacher = String(lesson.teacher_id) === String(userId)

    if (!isStudent && !isTeacher) {
      return NextResponse.json({ error: "Not authorized to message for this lesson" }, { status: 403 })
    }

    const receiverId = isStudent ? lesson.teacher_id : lesson.student_id

    const insertResult = await db.rawQuery(
      `INSERT INTO messages (lesson_id, sender_id, receiver_id, content) VALUES ($1::uuid, $2, $3, $4) RETURNING *`,
      [conversationId, userId, receiverId, content]
    )

    const message = insertResult.rows[0]

    // Send email notification to recipient
    try {
      const userInfo = await db.rawQuery(
        `
        SELECT u.email, u.first_name, u.last_name
        FROM users u
        WHERE u.id::text = $1::text
        `,
        [receiverId],
      )

      const recipient = userInfo.rows[0]

      const senderInfo = await db.rawQuery(
        `
        SELECT first_name, last_name
        FROM users
        WHERE id::text = $1::text
        `,
        [userId],
      )

      const sender = senderInfo.rows[0]

      if (recipient?.email) {
        const senderName = `${sender?.first_name || ""} ${sender?.last_name || ""}`.trim() || "Someone"
        const recipientName = `${recipient?.first_name || ""} ${recipient?.last_name || ""}`.trim() || "there"

        await sendNewMessageEmail(
          recipient.email,
          recipientName,
          senderName,
          message.content.slice(0, 200),
          new Date().toLocaleString(),
          // optional link: direct user to conversation
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/messages?lessonId=${conversationId}`,
        )
      }
    } catch (emailError) {
      console.warn("Failed to send message notification email:", emailError)
    }

    return NextResponse.json({
      id: message.id,
      content: message.content,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      timestamp: message.created_at,
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: error?.message || "Failed to send message" }, { status: 500 })
  }
}
