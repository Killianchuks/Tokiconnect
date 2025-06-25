import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Admin API (GET /api/admin/stats/languages): Starting request to fetch language statistics.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/stats/languages): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    // 1. Calculate Most Popular Language (based on number of teachers)
    const mostPopularResult = await db.rawQuery(
      `SELECT language, COUNT(*) AS teacher_count
       FROM users
       WHERE role = 'teacher' AND language IS NOT NULL AND language != ''
       GROUP BY language
       ORDER BY teacher_count DESC
       LIMIT 1`
    );
    const mostPopular = mostPopularResult.rows[0]?.language || "N/A"; // Default if no data

    // 2. Calculate Fastest Growing Language (Placeholder Logic)
    // Declare fastestGrowing once here with 'let'
    let fastestGrowing = "Real data requires more complex tracking"; // Initial placeholder value

    // To implement the real SQL for fastestGrowing, you would uncomment and use the following
    // SQL query, which calculates month-over-month growth based on new teacher sign-ups.
    // Ensure your 'users' table has a 'created_at' timestamp and a 'language' column.
    /*
    const fastestGrowingSql = `
        SELECT
            lang,
            growth_percentage
        FROM (
            WITH monthly_new_teachers AS (
                -- Count new teachers per language per month
                SELECT
                    u.language AS lang,
                    DATE_TRUNC('month', u.created_at) AS month,
                    COUNT(u.id) AS new_teachers_count
                FROM
                    users u
                WHERE
                    u.role = 'teacher'
                    AND u.language IS NOT NULL
                    AND u.language != ''
                GROUP BY
                    u.language,
                    DATE_TRUNC('month', u.created_at)
            )
            SELECT
                m.lang,
                m.month,
                m.new_teachers_count,
                LAG(m.new_teachers_count, 1, 0) OVER (PARTITION BY m.lang ORDER BY m.month) AS prev_month_teachers_count,
                (m.new_teachers_count - LAG(m.new_teachers_count, 1, 0) OVER (PARTITION BY m.lang ORDER BY m.month))::DECIMAL
                / NULLIF(LAG(m.new_teachers_count, 1, 0) OVER (PARTITION BY m.lang ORDER BY m.month), 0) * 100 AS growth_percentage
            FROM
                monthly_new_teachers m
            WHERE
                m.month = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        ) AS growth_metrics
        WHERE
            growth_percentage IS NOT NULL
        ORDER BY
            growth_percentage DESC
        LIMIT 1;
    `;

    const fastestGrowingResult = await db.rawQuery(fastestGrowingSql);
    // Reassign the value of fastestGrowing, do NOT redeclare it with 'let' or 'const'
    fastestGrowing = fastestGrowingResult.rows[0]?.lang || "N/A";
    */

    console.log("Admin API (GET /api/admin/stats/languages): Successfully fetched language statistics.");
    return NextResponse.json({
      mostPopular,
      fastestGrowing, // Use the 'fastestGrowing' variable that was declared above
    });

  } catch (error) {
    console.error("[ADMIN_LANGUAGE_STATS] Error fetching language statistics:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
