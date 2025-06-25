// app/api/teachers/me/bookings/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Teacher Bookings API (GET /api/teachers/me/bookings): Starting request.");

    const userSession = await auth.getCurrentUser(request);

    if (!userSession || !userSession.id || userSession.role !== "teacher") {
      console.warn("Teacher Bookings API: Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teacherId = userSession.id;

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
        s.first_name AS student_first_name,
        s.last_name AS student_last_name
       FROM bookings b
       JOIN users t ON b.teacher_id = t.id
       JOIN users s ON b.student_id = s.id
       WHERE b.teacher_id = $1
       ORDER BY b.lesson_date DESC`,
      [teacherId]
    );

    const bookings = result.rows.map((row: any) => ({
      id: row.id,
      studentName: `${row.student_first_name || ''} ${row.student_last_name || ''}`.trim(),
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

    console.log(`Teacher Bookings API: Successfully fetched ${bookings.length} bookings for teacher ${teacherId}.`);
    return NextResponse.json(bookings);

  } catch (error) {
    console.error("Teacher Bookings API (GET /api/teachers/me/bookings) error:", error);
    return new NextResponse(JSON.stringify({ message: "Failed to fetch bookings", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
