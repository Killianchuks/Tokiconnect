import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params
    const body = await request.json().catch(() => ({}))
    const note = typeof body?.note === "string" ? body.note.trim() : ""

    const tokenFromCookie = await auth.getAuthCookie(request)
    const authHeader = request.headers.get("authorization")
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    const token = tokenFromHeader || tokenFromCookie
    const session = token ? auth.verifyToken(token) : null
    const sessionUserId =
      session && typeof session === "object"
        ? ((session as any).id ?? (session as any).userId ?? (session as any).sub ?? null)
        : null
    const headerUserId = request.headers.get("x-user-id")
    const actingUserId = sessionUserId || headerUserId

    if (!actingUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lessonResult = await db.rawQuery(
      `SELECT id, teacher_id, student_id FROM lessons WHERE id::text = $1::text`,
      [lessonId],
    )

    if (!lessonResult.rows || lessonResult.rows.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const lesson = lessonResult.rows[0]
    const isTeacher = String(lesson.teacher_id) === String(actingUserId)
    const isStudent = String(lesson.student_id) === String(actingUserId)

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let updateResult
    if (note) {
      const noteEntry = `Decline note: ${note}`
      updateResult = await db.rawQuery(
        `UPDATE lessons
         SET status = 'declined',
             notes = CASE
               WHEN notes IS NULL OR TRIM(notes) = '' THEN $2
               ELSE notes || E'\\n' || $2
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id::text = $1::text
         RETURNING id`,
        [lessonId, noteEntry],
      )
    } else {
      updateResult = await db.rawQuery(
        `UPDATE lessons
         SET status = 'declined', updated_at = CURRENT_TIMESTAMP
         WHERE id::text = $1::text
         RETURNING id`,
        [lessonId],
      )
    }

    // Check if the lesson was found and updated
    if (!updateResult.rows || updateResult.rows.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, noteSaved: !!note })
  } catch (error) {
    console.error("Error declining lesson:", error)
    return NextResponse.json({ error: "Failed to decline lesson" }, { status: 500 })
  }
}
