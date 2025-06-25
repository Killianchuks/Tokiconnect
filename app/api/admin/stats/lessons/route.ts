import { NextResponse } from "next/server";
import type { NextRequest } from "next/server"; // Import NextRequest for better type safety
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth"; // Import auth and User type

export async function GET(request: NextRequest) { // Use NextRequest for middleware compatibility
  try {
    console.log("Admin API (GET /api/admin/stats/lessons): Starting request to fetch lesson statistics.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    // Use the combined getCurrentUser helper from your auth lib
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/stats/lessons): Unauthorized access attempt.");
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

    // Get total lessons
    const totalLessonsResult = await db.rawQuery("SELECT COUNT(*) FROM lessons");
    const totalLessons = Number.parseInt(totalLessonsResult.rows[0]?.count || '0', 10); // Safely parse count

    // Get lessons created in the last month
    const lessonsLastMonthResult = await db.rawQuery(
      "SELECT COUNT(*) FROM lessons WHERE created_at >= $1 AND created_at < $2",
      [lastMonth.toISOString(), now.toISOString()],
    );
    const lessonsLastMonth = Number.parseInt(lessonsLastMonthResult.rows[0]?.count || '0', 10); // Safely parse count

    // Get lessons created in the month before last month
    const lessonsTwoMonthsAgoResult = await db.rawQuery(
      "SELECT COUNT(*) FROM lessons WHERE created_at >= $1 AND created_at < $2",
      [twoMonthsAgo.toISOString(), lastMonth.toISOString()],
    );
    const lessonsTwoMonthsAgo = Number.parseInt(lessonsTwoMonthsAgoResult.rows[0]?.count || '0', 10); // Safely parse count

    // Calculate growth rate
    let growthRate = 0;
    if (lessonsTwoMonthsAgo > 0) {
      growthRate = ((lessonsLastMonth - lessonsTwoMonthsAgo) / lessonsTwoMonthsAgo) * 100;
    } else if (lessonsLastMonth > 0) {
      // If no lessons two months ago but there are last month, consider it infinite growth or 100%
      growthRate = 100;
    }
    // Round to 2 decimal places
    growthRate = parseFloat(growthRate.toFixed(2));

    console.log("Admin API (GET /api/admin/stats/lessons): Successfully fetched lesson statistics.");
    return NextResponse.json({
      totalLessons,
      growthRate,
      // You can add more stats here, e.g., completedLessons, activeLessons etc.
    });

  } catch (error) {
    console.error("[ADMIN_LESSONS_STATS] Error fetching lesson statistics:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
