import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Admin API (GET /api/admin/stats/support): Starting request to fetch support statistics.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/stats/support): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    // Fetch total tickets
    const totalTicketsResult = await db.rawQuery("SELECT COUNT(*) FROM support_tickets");
    const totalTickets = Number.parseInt(totalTicketsResult.rows[0]?.count || '0', 10);

    // Fetch open tickets
    const openTicketsResult = await db.rawQuery("SELECT COUNT(*) FROM support_tickets WHERE status = 'open'");
    const openTickets = Number.parseInt(openTicketsResult.rows[0]?.count || '0', 10);

    // Fetch in-progress tickets
    const inProgressTicketsResult = await db.rawQuery("SELECT COUNT(*) FROM support_tickets WHERE status = 'in_progress'");
    const inProgressTickets = Number.parseInt(inProgressTicketsResult.rows[0]?.count || '0', 10);

    // Calculate average response time (this is a placeholder for actual logic)
    // In a real application, you'd need 'created_at' and 'responded_at' (or 'closed_at') columns
    // on your support_tickets table to calculate this.
    // For now, let's return a simple placeholder string.
    const avgResponseTime = "N/A"; // Or implement complex SQL for average response time

    console.log("Admin API (GET /api/admin/stats/support): Successfully fetched support statistics.");
    return NextResponse.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      avgResponseTime,
    });

  } catch (error) {
    console.error("[ADMIN_SUPPORT_STATS] Error fetching support statistics:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
