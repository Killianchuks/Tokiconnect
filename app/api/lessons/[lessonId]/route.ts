import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import {
  sendStudentLessonConfirmedEmail,
  sendMeetingLinkUpdatedEmail,
  sendLessonCanceledEmail,
  sendLessonRescheduledEmail,
} from "@/lib/email"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await params

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 })
    }

    const result = await db.rawQuery(
      `
      SELECT
        l.id,
        l.teacher_id as "teacherId",
        l.student_id as "studentId",
        l.meeting_link as "meetingLink",
        l.language,
        l.type,
        l.duration_minutes as "durationMinutes",
        l.student_timezone as "studentTimezone",
        l.start_time as "startTime",
        l.end_time as "endTime",
        l.status,
        t.first_name as "teacherFirstName",
        t.last_name as "teacherLastName",
        t.profile_image as "teacherProfileImage",
        t.email as "teacherEmail",
        s.first_name as "studentFirstName",
        s.last_name as "studentLastName",
        s.profile_image as "studentProfileImage",
        s.email as "studentEmail"
      FROM lessons l
      LEFT JOIN users t ON t.id::text = l.teacher_id
      LEFT JOIN users s ON s.id::text = l.student_id
      WHERE l.id = $1
      `,
      [lessonId],
    )

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching lesson:", error)
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const body = await request.json()
    const { meetingLink, action, startTime, endTime } = body

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 })
    }

    // Get current user
    const tokenFromCookie = await auth.getAuthCookie(request)
    const authHeader = request.headers.get("authorization")
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    // Prefer explicit bearer token over cookie to avoid stale-cookie auth failures.
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

    // Verify the user is the teacher for this lesson
    const lessonResult = await db.rawQuery(
      `SELECT l.*, u.email as student_email, u.first_name as student_first_name, u.last_name as student_last_name,
              tu.first_name as teacher_first_name, tu.last_name as teacher_last_name
       FROM lessons l
       LEFT JOIN users u ON u.id::text = l.student_id::text
       LEFT JOIN users tu ON tu.id::text = l.teacher_id::text
       WHERE l.id::text = $1::text`,
      [lessonId]
    )

    if (lessonResult.rows.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const lesson = lessonResult.rows[0]

    const isTeacher = String(lesson.teacher_id) === String(actingUserId)
    const isStudent = String(lesson.student_id) === String(actingUserId)

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const teacherName = `${lesson.teacher_first_name || ""} ${lesson.teacher_last_name || ""}`.trim() || "your teacher"
    const studentName = `${lesson.student_first_name || ""} ${lesson.student_last_name || ""}`.trim() || "your student"

    if (action === "cancel") {
      if (lesson.status === "cancelled" || lesson.status === "canceled") {
        return NextResponse.json({ success: true, message: "Lesson already cancelled" })
      }

      await db.rawQuery(
        `UPDATE lessons SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id::text = $1::text`,
        [lessonId],
      )

      try {
        const recipientEmail = isTeacher ? lesson.student_email : lesson.teacher_email
        const recipientName = isTeacher ? studentName : teacherName
        const canceledByName = isTeacher ? teacherName : studentName
        const lessonDateTime = new Date(lesson.start_time).toLocaleString()

        if (recipientEmail) {
          await sendLessonCanceledEmail(
            recipientEmail,
            recipientName,
            canceledByName,
            lessonDateTime,
            lesson.language || "Language lesson",
          )
        }
      } catch (emailError) {
        console.warn("Failed to send cancellation email:", emailError)
      }

      return NextResponse.json({
        success: true,
        message: "Lesson cancelled successfully",
        status: "cancelled",
      })
    }

    if (action === "reschedule") {
      if (!startTime || !endTime) {
        return NextResponse.json({ error: "startTime and endTime are required" }, { status: 400 })
      }

      const newStart = new Date(startTime)
      const newEnd = new Date(endTime)
      if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime()) || newEnd <= newStart) {
        return NextResponse.json({ error: "Invalid reschedule time range" }, { status: 400 })
      }

      const oldLessonDateTime = new Date(lesson.start_time).toLocaleString()

      await db.rawQuery(
        `UPDATE lessons
         SET start_time = $1, end_time = $2, status = 'pending', updated_at = CURRENT_TIMESTAMP
         WHERE id::text = $3::text`,
        [newStart.toISOString(), newEnd.toISOString(), lessonId],
      )

      try {
        const recipientEmail = isTeacher ? lesson.student_email : lesson.teacher_email
        const recipientName = isTeacher ? studentName : teacherName
        const rescheduledByName = isTeacher ? teacherName : studentName
        const newLessonDateTime = newStart.toLocaleString()

        if (recipientEmail) {
          await sendLessonRescheduledEmail(
            recipientEmail,
            recipientName,
            rescheduledByName,
            oldLessonDateTime,
            newLessonDateTime,
            lesson.language || "Language lesson",
          )
        }
      } catch (emailError) {
        console.warn("Failed to send reschedule email:", emailError)
      }

      return NextResponse.json({
        success: true,
        message: "Lesson rescheduled successfully",
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        status: "pending",
      })
    }

    if (action === "accept") {
      if (lesson.status === "confirmed") {
        return NextResponse.json({ success: true, message: "Lesson already confirmed", status: "confirmed" })
      }

      await db.rawQuery(
        `UPDATE lessons
         SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
         WHERE id::text = $1::text`,
        [lessonId],
      )

      return NextResponse.json({
        success: true,
        message: "Lesson accepted successfully",
        status: "confirmed",
        meetingLink: lesson.meeting_link || null,
      })
    }

    if (!meetingLink || typeof meetingLink !== "string") {
      return NextResponse.json({ error: "Meeting link is required" }, { status: 400 })
    }

    // Validate meeting link format (basic URL validation)
    try {
      new URL(meetingLink)
    } catch {
      return NextResponse.json({ error: "Invalid meeting link format" }, { status: 400 })
    }

    if (!isTeacher) {
      return NextResponse.json({ error: "Only the teacher can update meeting links" }, { status: 403 })
    }

    // Update the lesson with the meeting link
    const hadMeetingLink = !!lesson.meeting_link
    await db.rawQuery(
      `UPDATE lessons SET meeting_link = $1, updated_at = CURRENT_TIMESTAMP WHERE id::text = $2::text`,
      [meetingLink, lessonId]
    )

    // Send appropriate email to student
    try {
      if (lesson.student_email) {
        const lessonDateTime = new Date(lesson.start_time).toLocaleString()

        if (hadMeetingLink) {
          // Meeting link was updated
          await sendMeetingLinkUpdatedEmail(
            lesson.student_email,
            studentName,
            teacherName,
            lessonDateTime,
            meetingLink
          )
        } else {
          // Meeting link was added for the first time
          const duration = lesson.duration_minutes || 60
          const language = lesson.language || "Language lesson"
          await sendStudentLessonConfirmedEmail(
            lesson.student_email,
            studentName,
            teacherName,
            lessonDateTime,
            duration,
            language,
            meetingLink
          )
        }
      }
    } catch (emailError) {
      console.warn("Failed to send student notification email:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: hadMeetingLink 
        ? "Meeting link updated successfully. Student has been notified."
        : "Meeting link added successfully. Student has been notified."
    })

  } catch (error: any) {
    console.error("Error updating meeting link:", error)
    return NextResponse.json({ error: error?.message || "Failed to update meeting link" }, { status: 500 })
  }
}
