import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth"; // For authentication/authorization

// GET handler: Provide statistics for a specific user
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Admin API (GET /api/admin/stats/users/[id]): Starting request for user ID: ${params.id}`);

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/stats/users/[id]): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const userId = params.id;

    // First, verify the user exists (optional, but good practice)
    const userExists = await db.rawQuery("SELECT id FROM users WHERE id = $1", [userId]);
    if (!userExists.rows || userExists.rows.length === 0) {
      console.log(`Admin API (GET /api/admin/stats/users/[id]): User with ID ${userId} not found for stats.`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user-specific statistics (example: total lessons taken/given)
    // Note: You'll need to adjust these queries based on your actual lesson/booking table schema.
    const totalLessonsResult = await db.rawQuery(
      "SELECT COUNT(*) FROM lessons WHERE student_id = $1 OR teacher_id = $1",
      [userId]
    );
    const totalLessons = Number.parseInt(totalLessonsResult.rows[0].count, 10);

    // Example: Average rating (if you have a ratings table/column)
    const averageRatingResult = await db.rawQuery(
      "SELECT AVG(rating) FROM ratings WHERE user_id = $1", // Assuming a ratings table linked to user_id
      [userId]
    );
    const averageRating = averageRatingResult.rows[0].avg || 0; // Default to 0 if no ratings

    console.log(`Admin API (GET /api/admin/stats/users/[id]): Successfully fetched statistics for user ID ${userId}.`);
    return NextResponse.json({
      userId,
      totalLessons,
      averageRating,
      // Add other user-specific stats here
    });

  } catch (error) {
    console.error("Admin API (GET /api/admin/stats/users/[id]) error:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
