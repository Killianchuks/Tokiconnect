import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Fix auth call - use getAuthCookie and verifyToken instead
    const token = await auth.getAuthCookie()
    const session = token ? auth.verifyToken(token) : null

    if (!session || session.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get current date and date for last month comparison
    const now = new Date()
    const lastMonth = new Date(now)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const twoMonthsAgo = new Date(lastMonth)
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1)

    // Get total lessons using rawQuery instead of db.lesson.count()
    const totalLessonsResult = await db.rawQuery("SELECT COUNT(*) FROM lessons")
    const totalLessons = Number.parseInt(totalLessonsResult.rows[0].count, 10) || 0

    // Get lessons created in the last month
    const lessonsLastMonthResult = await db.rawQuery(
      "SELECT COUNT(*) FROM lessons WHERE created_at >= $1 AND created_at < $2",
      [lastMonth.toISOString(), now.toISOString()],
    )
    const lessonsLastMonth = Number.parseInt(lessonsLastMonthResult.rows[0].count, 10) || 0

    // Get lessons created in the month before last month
    const lessonsTwoMonthsAgoResult = await db.rawQuery(
      "SELECT COUNT(*) FROM lessons WHERE created_at >= $1 AND created_at < $2",
      [twoMonthsAgo.toISOString(), lastMonth.toISOString()],
    )
    const lessonsTwoMonthsAgo = Number.parseInt(lessonsTwoMonthsAgoResult.rows[0].count, 10) || 0

    // Calculate growth rate
    const growthRate =
      lessonsTwoMonthsAgo > 0 ? Math.round(((lessonsLastMonth - lessonsTwoMonthsAgo) / lessonsTwoMonthsAgo) * 100) : 0

    return NextResponse.json({
      totalLessons,
      growthRate,
    })
  } catch (error) {
    console.error("[ADMIN_LESSONS_STATS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
