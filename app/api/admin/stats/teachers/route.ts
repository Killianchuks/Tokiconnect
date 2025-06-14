import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Get the auth token and verify it
    const token = await auth.getAuthCookie()
    const user = token ? auth.verifyToken(token) : null

    if (!user || user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get current date and date 30 days ago
    const now = new Date()
    const lastMonth = new Date(now)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const twoMonthsAgo = new Date(lastMonth)
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1)

    // Get total teachers
    const totalTeachersResult = await db.rawQuery("SELECT COUNT(*) FROM users WHERE role = 'teacher'")
    const totalTeachers = Number.parseInt(totalTeachersResult.rows[0].count)

    // Get teachers created in the last month
    const teachersLastMonthResult = await db.rawQuery(
      "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND created_at >= $1 AND created_at < $2",
      [lastMonth.toISOString(), now.toISOString()],
    )
    const teachersLastMonth = Number.parseInt(teachersLastMonthResult.rows[0].count)

    // Get teachers created in the month before last month
    const teachersTwoMonthsAgoResult = await db.rawQuery(
      "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND created_at >= $1 AND created_at < $2",
      [twoMonthsAgo.toISOString(), lastMonth.toISOString()],
    )
    const teachersTwoMonthsAgo = Number.parseInt(teachersTwoMonthsAgoResult.rows[0].count)

    // Calculate growth rate
    const growthRate =
      teachersTwoMonthsAgo > 0
        ? Math.round(((teachersLastMonth - teachersTwoMonthsAgo) / teachersTwoMonthsAgo) * 100)
        : 0

    // Get pending teachers
    const pendingTeachersResult = await db.rawQuery(
      "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND is_verified = false",
    )
    const pendingTeachers = Number.parseInt(pendingTeachersResult.rows[0].count)

    return NextResponse.json({
      totalTeachers,
      pendingTeachers,
      growthRate,
    })
  } catch (error) {
    console.error("[ADMIN_TEACHERS_STATS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
