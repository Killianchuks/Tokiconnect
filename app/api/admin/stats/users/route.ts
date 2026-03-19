import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Try cookie-based auth first
    const token = await auth.getAuthCookie()
    let user = token ? auth.verifyToken(token) : null

    // Fall back to header-based auth for localStorage users
    if (!user) {
      const userId = request.headers.get("x-user-id")
      const userRole = request.headers.get("x-user-role")
      if (userId && userRole === "admin") {
        user = { id: userId, role: userRole }
      }
    }

    if (!user || user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get current date and date 30 days ago
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get date for last month comparison
    const lastMonth = new Date(now)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const twoMonthsAgo = new Date(lastMonth)
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1)
    const threeMonthsAgo = new Date(twoMonthsAgo)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 1)

    // Get total users using rawQuery with proper parameter format
    try {
      console.log("Admin stats users API: Fetching total users count")
      const totalUsersResult = await db.rawQuery("SELECT COUNT(*) FROM users")
      const totalUsers = Number.parseInt(totalUsersResult.rows[0].count)

      // Get users created in the last month
      console.log("Admin stats users API: Fetching users from last month")
      const usersLastMonthResult = await db.rawQuery(
        "SELECT COUNT(*) FROM users WHERE created_at >= $1 AND created_at < $2",
        [twoMonthsAgo.toISOString(), lastMonth.toISOString()],
      )
      const usersLastMonth = Number.parseInt(usersLastMonthResult.rows[0].count)

      // Get users created in the month before last month
      console.log("Admin stats users API: Fetching users from two months ago")
      const usersTwoMonthsAgoResult = await db.rawQuery(
        "SELECT COUNT(*) FROM users WHERE created_at >= $1 AND created_at < $2",
        [threeMonthsAgo.toISOString(), twoMonthsAgo.toISOString()],
      )
      const usersTwoMonthsAgo = Number.parseInt(usersTwoMonthsAgoResult.rows[0].count)

      // Calculate growth rate
      const growthRate =
        usersTwoMonthsAgo > 0 ? Math.round(((usersLastMonth - usersTwoMonthsAgo) / usersTwoMonthsAgo) * 100) : 0

      // Get active users (users with is_active = true)
      console.log("Admin stats users API: Fetching active users")
      const activeUsersResult = await db.rawQuery("SELECT COUNT(*) FROM users WHERE is_active = true")
      const activeUsers = Number.parseInt(activeUsersResult.rows[0].count)

      console.log("Admin stats users API: Successfully fetched all data")
      return NextResponse.json({
        totalUsers,
        activeUsers,
        growthRate,
      })
    } catch (error) {
      console.error("Admin stats users API database error:", error)
      return new NextResponse("Database Error", { status: 500 })
    }
  } catch (error) {
    console.error("Admin stats users API error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
