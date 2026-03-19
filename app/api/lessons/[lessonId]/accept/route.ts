import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendMeetingLinkEmail } from "@/lib/email"
import { auth } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params
    const { meetingLink } = await request.json().catch(() => ({}))

    const tokenFromCookie = await auth.getAuthCookie(request)
    const authHeader = request.headers.get("authorization")
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    const token = tokenFromHeader || tokenFromCookie
    const session = token ? auth.verifyToken(token) : null
    const sessionUserId =
      session && typeof session === "object"
        ? ((session as any).id ?? (session as any).userId ?? (session as any).sub ?? null)
        : null
    const sessionRole =
      session && typeof session === "object" ? String((session as any).role || "").toLowerCase() : ""
    const headerUserId = request.headers.get("x-user-id")
    const headerRole = String(request.headers.get("x-user-role") || "").toLowerCase()
    const actingUserId = sessionUserId || headerUserId
    const isTeacherRole = sessionRole === "teacher" || headerRole === "teacher"

    if (!actingUserId && !isTeacherRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch existing lesson to verify and avoid duplicate confirmation
    const existingLesson = await db.rawQuery(
      `SELECT status, teacher_id, student_id, start_time FROM lessons WHERE id::text = $1::text`,
      [lessonId],
    )

    if (existingLesson.rows.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const lesson = existingLesson.rows[0]

    const isTeacher = actingUserId ? String(lesson.teacher_id) === String(actingUserId) : false
    const isStudent = actingUserId ? String(lesson.student_id) === String(actingUserId) : false
    if (!isTeacher && !isStudent && !isTeacherRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If already confirmed, return early (avoid duplicate emails)
    if (lesson.status === "confirmed") {
      return NextResponse.json({ message: "Lesson already confirmed" })
    }

    // Update lesson status (and optionally meeting link)
    const updateFields: string[] = ["status = 'confirmed'"]
    const params: any[] = [lessonId]

    if (meetingLink) {
      updateFields.push("meeting_link = $2")
      params.push(meetingLink)
    }

    const updateQuery = `UPDATE lessons SET ${updateFields.join(", ")} WHERE id::text = $1::text RETURNING id`
    const updateResult = await db.rawQuery(updateQuery, params)

    if (!updateResult.rows || updateResult.rows.length === 0) {
      return NextResponse.json({ error: "Failed to confirm lesson" }, { status: 500 })
    }

    // Default success response even if enrichment below fails.
    const fallbackResponse = {
      success: true,
      id: lessonId,
      status: "confirmed",
      meetingLink: meetingLink || null,
    }

    // Fetch enriched lesson details for UI/email, but do not fail acceptance if this step errors.
    try {
      const lessonResult = await db.rawQuery(
        `
        SELECT
          l.id, l.teacher_id as "teacherId", l.student_id as "studentId",
          l.meeting_link as "meetingLink",
          l.language, l.start_time as "startTime", l.end_time as "endTime", l.status,
          t.first_name as "teacherFirstName", t.last_name as "teacherLastName",
          t.email as "teacherEmail", t.profile_image as "teacherProfileImage",
          s.first_name as "studentFirstName", s.last_name as "studentLastName",
          s.email as "studentEmail", s.profile_image as "studentProfileImage"
        FROM lessons l
        LEFT JOIN users t ON t.id::text = l.teacher_id::text
        LEFT JOIN users s ON s.id::text = l.student_id::text
        WHERE l.id::text = $1::text
        `,
        [lessonId],
      )

      if (!lessonResult.rows || lessonResult.rows.length === 0) {
        return NextResponse.json(fallbackResponse)
      }

      const updatedLesson = lessonResult.rows[0]

      if (updatedLesson.meetingLink) {
        try {
          const lessonTime = new Date(updatedLesson.startTime).toLocaleString()
          const teacherName = `${updatedLesson.teacherFirstName} ${updatedLesson.teacherLastName}`.trim() || "Teacher"
          const studentName = `${updatedLesson.studentFirstName} ${updatedLesson.studentLastName}`.trim() || "Student"
          const emailTasks: Promise<void>[] = []

          if (updatedLesson.teacherEmail) {
            emailTasks.push(
              sendMeetingLinkEmail(updatedLesson.teacherEmail, teacherName, updatedLesson.meetingLink, lessonTime, studentName),
            )
          }

          if (updatedLesson.studentEmail) {
            emailTasks.push(
              sendMeetingLinkEmail(updatedLesson.studentEmail, studentName, updatedLesson.meetingLink, lessonTime, teacherName),
            )
          }

          if (emailTasks.length > 0) {
            await Promise.all(emailTasks)
          }
        } catch (emailError) {
          console.warn("Lesson accepted, but failed to send meeting-link email:", emailError)
        }
      }

      const formattedLesson = {
        success: true,
        id: updatedLesson.id,
        teacherId: updatedLesson.teacherId,
        teacherName: `${updatedLesson.teacherFirstName || ""} ${updatedLesson.teacherLastName || ""}`.trim(),
        teacherAvatar: updatedLesson.teacherProfileImage,
        studentId: updatedLesson.studentId,
        studentName: `${updatedLesson.studentFirstName || ""} ${updatedLesson.studentLastName || ""}`.trim(),
        studentAvatar: updatedLesson.studentProfileImage,
        language: updatedLesson.language,
        date: updatedLesson.startTime ? new Date(updatedLesson.startTime).toLocaleDateString() : null,
        time: updatedLesson.startTime ? new Date(updatedLesson.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
        endTime: updatedLesson.endTime ? new Date(updatedLesson.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
        duration:
          updatedLesson.startTime && updatedLesson.endTime
            ? Math.round((new Date(updatedLesson.endTime).getTime() - new Date(updatedLesson.startTime).getTime()) / 60000)
            : null,
        status: updatedLesson.status || "confirmed",
        meetingLink: updatedLesson.meetingLink || null,
      }

      return NextResponse.json(formattedLesson)
    } catch (enrichmentError) {
      console.warn("Lesson accepted, but failed to load enriched lesson details:", enrichmentError)
      return NextResponse.json(fallbackResponse)
    }
  } catch (error) {
    console.error("Error accepting lesson:", error)
    return NextResponse.json({ error: "Failed to accept lesson" }, { status: 500 })
  }
}
