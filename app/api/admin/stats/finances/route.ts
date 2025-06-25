import { NextResponse } from "next/server";
import type { NextRequest } from "next/server"; // Import NextRequest for better type safety
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth"; // Import auth and User type

export async function GET(request: NextRequest) { // Use NextRequest for middleware compatibility
  try {
    console.log("Admin API (GET /api/admin/stats/finances): Starting request to fetch finance statistics.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    // Use the combined getCurrentUser helper from your auth lib
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/stats/finances): Unauthorized access attempt.");
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

    // Get total revenue
    // It's generally better to select only necessary columns.
    // Assuming 'amount' is the column for transaction value and 'created_at' for timestamp
    const transactionsResult = await db.rawQuery(`
      SELECT SUM(amount) AS total_revenue FROM transactions
    `);
    const totalRevenue = transactionsResult.rows[0]?.total_revenue || 0;

    // Get revenue from the last month
    const transactionsLastMonthResult = await db.rawQuery(
      `
      SELECT SUM(amount) AS monthly_revenue FROM transactions
      WHERE created_at >= $1 AND created_at < $2
    `,
      [lastMonth.toISOString(), now.toISOString()],
    );
    const revenueLastMonth = transactionsLastMonthResult.rows[0]?.monthly_revenue || 0;

    // Get revenue from the month before last month
    const transactionsTwoMonthsAgoResult = await db.rawQuery(
      `
      SELECT SUM(amount) AS monthly_revenue FROM transactions
      WHERE created_at >= $1 AND created_at < $2
    `,
      [twoMonthsAgo.toISOString(), lastMonth.toISOString()],
    );
    const revenueTwoMonthsAgo = transactionsTwoMonthsAgoResult.rows[0]?.monthly_revenue || 0;

    // Calculate growth rate
    let growthRate = 0;
    if (revenueTwoMonthsAgo > 0) {
      growthRate = ((revenueLastMonth - revenueTwoMonthsAgo) / revenueTwoMonthsAgo) * 100;
    } else if (revenueLastMonth > 0) {
      // If no revenue two months ago but there is last month, consider it infinite growth or 100%
      growthRate = 100;
    }
    // Round to 2 decimal places
    growthRate = parseFloat(growthRate.toFixed(2));

    console.log("Admin API (GET /api/admin/stats/finances): Successfully fetched finance statistics.");
    return NextResponse.json({
      totalRevenue,
      growthRate,
      // You can add more stats here if your frontend needs them, e.g.,
      // revenueLastMonth,
      // revenueTwoMonthsAgo,
      // pendingPayouts: 0, // If you have a payouts table and need to calculate this
    });

  } catch (error) {
    console.error("[ADMIN_FINANCES_STATS] Error fetching finance statistics:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
