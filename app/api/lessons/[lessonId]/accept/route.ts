import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { lessonId: string } }) {
  try {
    const lessonId = params.lessonId

    // Update lesson status to confirmed using raw SQL
    const updateResult = await db.rawQuery(`UPDATE lessons SET status = 'confirmed' WHERE id = $1 RETURNING id`, [
      lessonId,
    ])

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Fetch the updated lesson with teacher and student details
    const lessonResult = await db.rawQuery(
      `
      SELECT 
        l.id, l.teacher_id as "teacherId", l.student_id as "studentId", 
        l.language, l.level, l.start_time as "startTime", l.end_time as "endTime", l.status,
        t.first_name as "teacherFirstName", t.last_name as "teacherLastName", 
        t.email as "teacherEmail", t.profile_image as "teacherProfileImage",
        s.first_name as "studentFirstName", s.last_name as "studentLastName", 
        s.email as "studentEmail", s.profile_image as "studentProfileImage"
      FROM lessons l
      JOIN users t ON l.teacher_id = t.id
      JOIN users s ON l.student_id = s.id
      WHERE l.id = $1
      `,
      [lessonId],
    )

    if (lessonResult.rows.length === 0) {
      return NextResponse.json({ error: "Failed to retrieve updated lesson" }, { status: 500 })
    }

    const lesson = lessonResult.rows[0]

    // Format the lesson data for the response
    const formattedLesson = {
      id: lesson.id,
      teacherId: lesson.teacherId,
      teacherName: `${lesson.teacherFirstName} ${lesson.teacherLastName}`,
      teacherAvatar: lesson.teacherProfileImage,
      studentId: lesson.studentId,
      studentName: `${lesson.studentFirstName} ${lesson.studentLastName}`,
      studentAvatar: lesson.studentProfileImage,
      language: lesson.language,
      level: lesson.level,
      date: new Date(lesson.startTime).toLocaleDateString(),
      time: new Date(lesson.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTime: new Date(lesson.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      duration: Math.round((new Date(lesson.endTime).getTime() - new Date(lesson.startTime).getTime()) / 60000),
      status: lesson.status,
    }

    return NextResponse.json(formattedLesson)
  } catch (error) {
    console.error("Error accepting lesson:", error)
    return NextResponse.json({ error: "Failed to accept lesson" }, { status: 500 })
  }
}
