import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Fix: Use auth.getAuthCookie() and auth.verifyToken() instead of calling auth directly
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

    // Fix: Use rawQuery instead of db.transaction which doesn't exist
    // Get total revenue
    const transactionsResult = await db.rawQuery(`
      SELECT * FROM transactions
    `)
    const transactions = transactionsResult.rows || []

    const totalRevenue = transactions.reduce((sum: number, transaction: any) => sum + (transaction.amount || 0), 0)

    // Get revenue from the last month
    const transactionsLastMonthResult = await db.rawQuery(
      `
      SELECT * FROM transactions 
      WHERE created_at >= $1 AND created_at < $2
    `,
      [lastMonth.toISOString(), now.toISOString()],
    )
    const transactionsLastMonth = transactionsLastMonthResult.rows || []

    const revenueLastMonth = transactionsLastMonth.reduce(
      (sum: number, transaction: any) => sum + (transaction.amount || 0),
      0,
    )

    // Get revenue from the month before last month
    const transactionsTwoMonthsAgoResult = await db.rawQuery(
      `
      SELECT * FROM transactions 
      WHERE created_at >= $1 AND created_at < $2
    `,
      [twoMonthsAgo.toISOString(), lastMonth.toISOString()],
    )
    const transactionsTwoMonthsAgo = transactionsTwoMonthsAgoResult.rows || []

    const revenueTwoMonthsAgo = transactionsTwoMonthsAgo.reduce(
      (sum: number, transaction: any) => sum + (transaction.amount || 0),
      0,
    )

    // Calculate growth rate
    const growthRate =
      revenueTwoMonthsAgo > 0 ? Math.round(((revenueLastMonth - revenueTwoMonthsAgo) / revenueTwoMonthsAgo) * 100) : 0

    return NextResponse.json({
      totalRevenue,
      growthRate,
    })
  } catch (error) {
    console.error("[ADMIN_FINANCES_STATS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
