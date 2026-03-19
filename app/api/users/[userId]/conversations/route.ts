import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Fetch lessons where the user is student or teacher and include the other party as the conversation partner.
    const query = `
      SELECT
        l.id as lesson_id,
        l.status,
        l.start_time,
        l.end_time,
        l.meeting_link,
        l.type,
        l.duration_minutes,
        l.language,
        l.meeting_link,
        l.created_at,
        l.updated_at,
        -- Determine the conversation partner
        CASE
          WHEN l.student_id::text = $1::text THEN l.teacher_id
          ELSE l.student_id
        END as partner_id,
        CASE
          WHEN l.student_id::text = $1::text THEN tu.first_name
          ELSE su.first_name
        END as partner_first_name,
        CASE
          WHEN l.student_id::text = $1::text THEN tu.last_name
          ELSE su.last_name
        END as partner_last_name,
        CASE
          WHEN l.student_id::text = $1::text THEN tu.profile_image
          ELSE su.profile_image
        END as partner_image,
        -- Latest message for preview
        m.content as last_message,
        m.created_at as last_message_at,
      COALESCE(
        (
          SELECT COUNT(*)
          FROM messages
          WHERE lesson_id::text = l.id::text
            AND receiver_id::text = $1::text
            AND is_read = false
        ),
        0
      ) as unread_count
      FROM lessons l
      -- Cast lesson foreign keys (stored as text/uuid) to text for safe comparison
      LEFT JOIN users tu ON tu.id::text = l.teacher_id::text
      LEFT JOIN users su ON su.id::text = l.student_id::text
      LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM messages
        WHERE lesson_id::text = l.id::text
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      WHERE l.student_id::text = $1::text OR l.teacher_id::text = $1::text
      ORDER BY COALESCE(m.created_at, l.start_time) DESC
    `

    const result = await db.rawQuery(query, [userId])

    const conversations = (result.rows || []).map((row: any) => ({
      id: row.lesson_id,
      partnerId: row.partner_id,
      name: `${row.partner_first_name || ""} ${row.partner_last_name || ""}`.trim() || "Conversation",
      avatar: row.partner_image,
      lastMessage: row.last_message || `Lesson on ${new Date(row.start_time).toLocaleDateString()}`,
      lastMessageTime: row.last_message_at || row.start_time,
      status: row.status,
      unreadCount: Number(row.unread_count || 0),
      meetingLink: row.meeting_link,
      metadata: {
        meetingLink: row.meeting_link,
        type: row.type,
        durationMinutes: row.duration_minutes,
        language: row.language,
        startTime: row.start_time,
        endTime: row.end_time,
      },
    }))

    return NextResponse.json(conversations)
  } catch (error: any) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: error?.message || "Failed to fetch conversations" }, { status: 500 })
  }
}
