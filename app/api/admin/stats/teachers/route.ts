import { NextResponse } from "next/server";
import type { NextRequest } from "next/server"; // Import NextRequest for better type safety
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth"; // Import auth and User type
import { PoolClient, QueryResult } from 'pg'; // Ensure PoolClient and QueryResult are imported if used for transactions

export async function GET(request: NextRequest) { // Use NextRequest for middleware compatibility
  try {
    console.log("Admin API (GET /api/admin/stats/teachers): Starting request to fetch teacher statistics.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    // Use the combined getCurrentUser helper from your auth lib
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/stats/teachers): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    // Get current date and date for last month comparison
    const now = new Date();
    // Set to start of current month for clearer monthly calculations
    now.setDate(1); // Set to 1st day of month
    now.setHours(0, 0, 0, 0); // Set time to midnight

    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const twoMonthsAgo = new Date(lastMonth);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1);

    // Get total teachers
    const totalTeachersResult = await db.rawQuery("SELECT COUNT(*) FROM users WHERE role = 'teacher'");
    const totalTeachers = Number.parseInt(totalTeachersResult.rows[0]?.count || '0', 10); // Safely parse count

    // Get active teachers
    const activeTeachersResult = await db.rawQuery("SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status = 'active'");
    const activeTeachers = Number.parseInt(activeTeachersResult.rows[0]?.count || '0', 10);

    // Get teachers created in the last month
    const teachersLastMonthResult = await db.rawQuery(
      "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND created_at >= $1 AND created_at < $2",
      [lastMonth.toISOString(), now.toISOString()],
    );
    const teachersLastMonth = Number.parseInt(teachersLastMonthResult.rows[0]?.count || '0', 10);

    // Get teachers created in the month before last month
    const teachersTwoMonthsAgoResult = await db.rawQuery(
      "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND created_at >= $1 AND created_at < $2",
      [twoMonthsAgo.toISOString(), lastMonth.toISOString()],
    );
    const teachersTwoMonthsAgo = Number.parseInt(teachersTwoMonthsAgoResult.rows[0]?.count || '0', 10);

    // Calculate growth rate
    let growthRate = 0;
    if (teachersTwoMonthsAgo > 0) {
      growthRate = ((teachersLastMonth - teachersTwoMonthsAgo) / teachersTwoMonthsAgo) * 100;
    } else if (teachersLastMonth > 0) {
      // If no teachers two months ago but there are last month, consider it infinite growth or 100%
      growthRate = 100;
    }
    // Round to 2 decimal places
    growthRate = parseFloat(growthRate.toFixed(2));

    // Get pending teachers (assuming 'pending' status in the 'status' column)
    const pendingTeachersResult = await db.rawQuery(
      "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status = 'pending'",
    );
    const pendingTeachers = Number.parseInt(pendingTeachersResult.rows[0]?.count || '0', 10);

    // Get average rating for teachers
    // Assuming you have a 'ratings' table or a 'rating' column on the 'users' table for teachers.
    // If 'rating' column does not exist on 'users' table, you need to add it or fetch from a separate table.
    const averageRatingResult = await db.rawQuery(
        "SELECT AVG(rating) FROM users WHERE role = 'teacher' AND rating IS NOT NULL"
    );
    const averageRating = parseFloat(Number(averageRatingResult.rows[0]?.avg || 0).toFixed(1)); // ToFixed(1) for display

    // Get languages taught (count of unique languages across all teachers)
    // CORRECTED: Use a subquery with unnest to count distinct languages
    const languagesTaughtResult = await db.rawQuery(
        `SELECT COUNT(DISTINCT language_unnested) AS unique_languages
         FROM (
             SELECT UNNEST(STRING_TO_ARRAY(language, ',')) AS language_unnested
             FROM users
             WHERE role = 'teacher' AND language IS NOT NULL AND language != ''
         ) AS unnested_languages;`
    );
    const languagesTaught = Number.parseInt(languagesTaughtResult.rows[0]?.unique_languages || '0', 10);


    console.log("Admin API (GET /api/admin/stats/teachers): Successfully fetched teacher statistics.");
    return NextResponse.json({
      totalTeachers,
      activeTeachers, // Added active teachers stat
      pendingTeachers,
      growthRate,
      averageRating,    // Added average rating stat
      languagesTaught,  // Added languages taught stat
    });

  } catch (error) {
    console.error("[ADMIN_TEACHERS_STATS] Error fetching teacher statistics:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
