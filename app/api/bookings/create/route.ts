// app/api/bookings/create/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    console.log("--- Bookings API (POST /api/bookings/create) Request Start ---");

    const userSession = await auth.getCurrentUser(request);
    console.log(`[Bookings API] User Session retrieved: ${userSession ? `ID: ${userSession.id}, Role: ${userSession.role}` : 'None'}`);

    if (!userSession || !userSession.id || userSession.role !== "student") {
      console.warn("Bookings API: Unauthorized booking attempt (not logged in or not a student).");
      console.log("--- Bookings API (POST /api/bookings/create) Request End: Unauthorized ---");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const studentId = userSession.id;
    const requestBody = await request.json();
    const { teacherId, lessonType, lessonDate, lessonDuration, amount, notes } = requestBody;

    console.log("[Bookings API] Request body received:", JSON.stringify(requestBody, null, 2));
    console.log(`[Bookings API] Destructured fields: studentId=${studentId}, teacherId=${teacherId}, lessonType=${lessonType}, lessonDate=${lessonDate}, lessonDuration=${lessonDuration}, amount=${amount}`);

    if (!teacherId || !lessonType || !lessonDate || lessonDuration === undefined || amount === undefined || amount === null) {
      console.warn("Bookings API: Missing required booking fields. Fields received:", { teacherId, lessonType, lessonDate, lessonDuration, amount });
      console.log("--- Bookings API (POST /api/bookings/create) Request End: Missing Fields ---");
      return new NextResponse(JSON.stringify({ message: "Missing required booking fields" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const parsedLessonDate = new Date(lessonDate);
    console.log(`[Bookings API] Raw lessonDate: "${lessonDate}"`);
    console.log(`[Bookings API] Parsed lessonDate (new Date()): ${parsedLessonDate.toISOString()}`);
    if (isNaN(parsedLessonDate.getTime())) {
        console.warn(`Bookings API: Invalid lesson date format received: "${lessonDate}". Date parsing resulted in Invalid Date.`);
        console.log("--- Bookings API (POST /api/bookings/create) Request End: Invalid Date ---");
        return new NextResponse(JSON.stringify({ message: `Invalid lesson date format: ${lessonDate}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount)) {
        console.warn(`[Bookings API] Invalid amount received: "${amount}".`);
        console.log("--- Bookings API (POST /api/bookings/create) Request End: Invalid Amount ---");
        return new NextResponse(JSON.stringify({ message: `Invalid amount: ${amount}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // NEW: Check for existing booking to prevent duplicates
    console.log("[Bookings API] Checking for existing duplicate booking...");
    const existingBooking = await db.rawQuery(
      `SELECT id FROM bookings
       WHERE student_id = $1 AND teacher_id = $2
       AND lesson_type = $3 AND lesson_date = $4`,
      [studentId, teacherId, lessonType, parsedLessonDate]
    );

    if (existingBooking.rows.length > 0) {
      console.warn(`[Bookings API] Duplicate booking detected for student ${studentId} and teacher ${teacherId} on ${parsedLessonDate.toISOString()}. Skipping creation.`);
      // Return a 200 OK or 409 Conflict, depending on desired client behavior.
      // 200 OK with a message is often better for idempotent operations.
      return new NextResponse(JSON.stringify({
        message: "Booking already exists for this lesson slot. No new booking created.",
        bookingId: existingBooking.rows[0].id,
        status: "already_exists"
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log("[Bookings API] No duplicate booking found. Proceeding with creation.");


    // Fetch the teacher's default_meeting_link
    let teacherMeetingLink: string | null = null;
    try {
      const teacherResult = await db.rawQuery(
        `SELECT default_meeting_link FROM users WHERE id = $1 AND role = 'teacher'`,
        [teacherId]
      );
      if (teacherResult.rows.length > 0) {
        teacherMeetingLink = teacherResult.rows[0].default_meeting_link;
        console.log(`[Bookings API] Fetched teacher's default_meeting_link: ${teacherMeetingLink}`);
      } else {
        console.warn(`[Bookings API] Teacher ${teacherId} not found or not a teacher. No default_meeting_link to apply.`);
      }
    } catch (linkError) {
      console.error("[Bookings API] Error fetching teacher's default_meeting_link:", linkError);
    }


    // Insert into bookings table, including the new meeting_link
    const insertQuery = `
      INSERT INTO bookings (student_id, teacher_id, lesson_type, lesson_date, lesson_duration_minutes, amount, notes, status, meeting_link)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, student_id, teacher_id, lesson_type, lesson_date, lesson_duration_minutes, amount, status, created_at, meeting_link
    `;
    const queryParams = [
      studentId,
      teacherId,
      lessonType,
      parsedLessonDate,
      lessonDuration,
      finalAmount,
      notes || null,
      'confirmed',
      teacherMeetingLink
    ];

    console.log("[Bookings API] SQL Insert Query:", insertQuery.replace(/\s+/g, ' ').trim());
    console.log("[Bookings API] SQL Query Parameters:", queryParams);

    const result = await db.rawQuery(insertQuery, queryParams);

    if (result.rows.length === 0) {
      console.error("Bookings API: Failed to insert booking into database. No rows returned from INSERT.");
      console.log("--- Bookings API (POST /api/bookings/create) Request End: DB Insert Failed ---");
      throw new Error("Failed to create booking record: Database did not return rows.");
    }

    const newBooking = result.rows[0];
    console.log(`[Bookings API] Successfully created booking with ID: ${newBooking.id} for student ${studentId} with teacher ${teacherId}.`);
    console.log(`[Bookings API] New Booking details: ${JSON.stringify(newBooking, null, 2)}`);
    console.log("--- Bookings API (POST /api/bookings/create) Request End: Success ---");

    return NextResponse.json({
      message: "Booking confirmed successfully",
      bookingId: newBooking.id,
      status: newBooking.status,
      lessonDate: newBooking.lesson_date,
      teacherId: newBooking.teacher_id,
      studentId: newBooking.student_id,
      meetingLink: newBooking.meeting_link,
    });

  } catch (error) {
    console.error("--- Bookings API (POST /api/bookings/create) Error Encountered ---");
    console.error("Error creating booking session:", error);
    console.log("--- Bookings API (POST /api/bookings/create) Request End: Error ---");
    // Check if the error is due to a unique constraint violation (if you add one later)
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
      return new NextResponse(JSON.stringify({ message: "A booking for this slot already exists." }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new NextResponse(JSON.stringify({ message: "Failed to create booking", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
