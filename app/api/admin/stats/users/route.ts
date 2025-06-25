import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth"; // For authentication/authorization

// GET handler: Provide aggregate statistics about users
export async function GET(request: NextRequest) {
  try {
    console.log("Admin API (GET /api/admin/stats/users): Starting request to fetch user statistics.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/stats/users): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    // Fetch various statistics
    const totalUsersResult = await db.rawQuery("SELECT COUNT(*) FROM users");
    const totalUsers = Number.parseInt(totalUsersResult.rows[0].count, 10);

    const activeUsersResult = await db.rawQuery("SELECT COUNT(*) FROM users WHERE status = 'active'");
    const activeUsers = Number.parseInt(activeUsersResult.rows[0].count, 10);

    const teachersResult = await db.rawQuery("SELECT COUNT(*) FROM users WHERE role = 'teacher'");
    const totalTeachers = Number.parseInt(teachersResult.rows[0].count, 10);

    const studentsResult = await db.rawQuery("SELECT COUNT(*) FROM users WHERE role = 'student'");
    const totalStudents = Number.parseInt(studentsResult.rows[0].count, 10);

    // Example: New users in the last 30 days
    const newUsersLast30DaysResult = await db.rawQuery(
      "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"
    );
    const newUsersLast30Days = Number.parseInt(newUsersLast30DaysResult.rows[0].count, 10);

    console.log("Admin API (GET /api/admin/stats/users): Successfully fetched user statistics.");
    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalTeachers,
      totalStudents,
      newUsersLast30Days,
      // Add other relevant stats here
    });

  } catch (error) {
    console.error("Admin API (GET /api/admin/stats/users) error:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
