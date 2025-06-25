// app/api/users/[id]/stats/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth"; // To get user's role from session

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    console.log(`--- User Stats API (GET /api/users/${userId}/stats) Request Start ---`);

    const userSession = await auth.getCurrentUser(request);
    console.log(`[User Stats API] User Session retrieved: ${userSession ? `ID: ${userSession.id}, Role: ${userSession.role}` : 'None'}`);

    if (!userSession || userSession.id !== userId) {
      console.warn(`[User Stats API] Unauthorized attempt to access stats for user ${userId} by user ${userSession?.id}.`);
      console.log("--- User Stats API Request End: Unauthorized ---");
      return new NextResponse(JSON.stringify({ success: false, message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userRole = userSession.role;
    let stats = {
      lessonsCompleted: 0,
      lessonsUpcoming: 0,
      favoriteTeachers: 0,
      activeStudents: 0,
      averageRating: 0.0,
      totalHours: 0,
      languagesCount: 0,
    };

    // Define a common timestamp for comparison in UTC
    // This makes the 'upcoming' logic consistent regardless of server/client local time zones.
    const nowUtc = "timezone('utc', NOW())";

    if (userRole === "student") {
      console.log(`[User Stats API] Fetching student stats for ID: ${userId}`);

      // Count upcoming lessons for student
      const upcomingLessonsResult = await db.rawQuery(
        `SELECT COUNT(*) FROM bookings
         WHERE student_id = $1
         AND lesson_date > ${nowUtc} -- Changed to use UTC now
         AND status = 'confirmed'`,
        [userId]
      );
      stats.lessonsUpcoming = parseInt(upcomingLessonsResult.rows[0]?.count || '0', 10);
      console.log(`[User Stats API] Student upcoming lessons: ${stats.lessonsUpcoming}`);


      // Count completed lessons for student
      const completedLessonsResult = await db.rawQuery(
        `SELECT COUNT(*) FROM bookings
         WHERE student_id = $1
         AND status = 'completed'`,
        [userId]
      );
      stats.lessonsCompleted = parseInt(completedLessonsResult.rows[0]?.count || '0', 10);
      console.log(`[User Stats API] Student completed lessons: ${stats.lessonsCompleted}`);


      // Sum total duration of completed lessons for student (for 'Hours Completed')
      const totalHoursResult = await db.rawQuery(
        `SELECT SUM(lesson_duration_minutes) AS total_minutes FROM bookings
         WHERE student_id = $1
         AND status = 'completed'`,
        [userId]
      );
      stats.totalHours = parseFloat((totalHoursResult.rows[0]?.total_minutes / 60 || 0).toFixed(1));
      console.log(`[User Stats API] Student total hours completed: ${stats.totalHours}`);

    } else if (userRole === "teacher") {
      console.log(`[User Stats API] Fetching teacher stats for ID: ${userId}`);

      // Count upcoming lessons for teacher
      const upcomingLessonsResult = await db.rawQuery(
        `SELECT COUNT(*) FROM bookings
         WHERE teacher_id = $1
         AND lesson_date > ${nowUtc} -- Changed to use UTC now
         AND status = 'confirmed'`,
        [userId]
      );
      stats.lessonsUpcoming = parseInt(upcomingLessonsResult.rows[0]?.count || '0', 10);
      console.log(`[User Stats API] Teacher upcoming lessons: ${stats.lessonsUpcoming}`);


      // Count completed lessons for teacher
      const completedLessonsResult = await db.rawQuery(
        `SELECT COUNT(*) FROM bookings
         WHERE teacher_id = $1
         AND status = 'completed'`,
        [userId]
      );
      stats.lessonsCompleted = parseInt(completedLessonsResult.rows[0]?.count || '0', 10);
      console.log(`[User Stats API] Teacher completed lessons: ${stats.lessonsCompleted}`);


      // Count active students (distinct students with at least one confirmed/completed lesson with this teacher)
      const activeStudentsResult = await db.rawQuery(
        `SELECT COUNT(DISTINCT student_id) FROM bookings
         WHERE teacher_id = $1
         AND status IN ('confirmed', 'completed')`,
        [userId]
      );
      stats.activeStudents = parseInt(activeStudentsResult.rows[0]?.count || '0', 10);
      console.log(`[User Stats API] Teacher active students: ${stats.activeStudents}`);

      // Sum total duration of completed lessons for teacher (for 'Hours Completed')
      const totalHoursResult = await db.rawQuery(
        `SELECT SUM(lesson_duration_minutes) AS total_minutes FROM bookings
         WHERE teacher_id = $1
         AND status = 'completed'`,
        [userId]
      );
      stats.totalHours = parseFloat((totalHoursResult.rows[0]?.total_minutes / 60 || 0).toFixed(1));
      console.log(`[User Stats API] Teacher total hours completed: ${stats.totalHours}`);

    } else {
      console.warn(`[User Stats API] User role '${userRole}' not supported for stats. Returning default.`);
    }

    console.log(`[User Stats API] Final stats for user ${userId}: ${JSON.stringify(stats)}`);
    console.log("--- User Stats API Request End: Success ---");
    return NextResponse.json({ success: true, data: stats });

  } catch (error) {
    console.error(`--- User Stats API (GET /api/users/${params.id}/stats) Error Encountered ---`);
    console.error("Error fetching user stats:", error);
    console.log("--- User Stats API Request End: Error ---");
    return new NextResponse(JSON.stringify({ success: false, message: "Error fetching user stats", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
