// app/api/students/me/bookings/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Student Bookings API (GET /api/students/me/bookings): Starting request.");

    const userSession = await auth.getCurrentUser(request);

    if (!userSession || !userSession.id || userSession.role !== "student") {
      console.warn("Student Bookings API: Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const studentId = userSession.id;

    const result = await db.rawQuery(
      `SELECT
        b.id,
        b.lesson_type,
        b.lesson_date,
        b.lesson_duration_minutes,
        b.amount,
        b.currency,
        b.status,
        b.notes,
        b.created_at,
        b.meeting_link, -- Select the new column
        t.first_name AS teacher_first_name,
        t.last_name AS teacher_last_name
       FROM bookings b
       JOIN users s ON b.student_id = s.id
       JOIN users t ON b.teacher_id = t.id
       WHERE b.student_id = $1
       ORDER BY b.lesson_date ASC`,
      [studentId]
    );

    const bookings = result.rows.map((row: any) => ({
      id: row.id,
      teacherName: `${row.teacher_first_name || ''} ${row.teacher_last_name || ''}`.trim(),
      lessonType: row.lesson_type,
      lessonDate: new Date(row.lesson_date).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }),
      lessonDurationMinutes: row.lesson_duration_minutes,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      meetingLink: row.meeting_link, // Include new field
    }));

    console.log(`Student Bookings API: Successfully fetched ${bookings.length} bookings for student ${studentId}.`);
    return NextResponse.json(bookings);

  } catch (error) {
    console.error("Student Bookings API (GET /api/students/me/bookings) error:", error);
    return new NextResponse(JSON.stringify({ message: "Failed to fetch bookings", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
