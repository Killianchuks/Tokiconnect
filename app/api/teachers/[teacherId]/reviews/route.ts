import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Assuming your database connection is here

// Define an interface for how a review looks in your database
interface DbReviewRaw {
  id: string; // Review ID
  teacher_id: string; // The ID of the teacher being reviewed
  student_id: string; // The ID of the student who wrote the review
  rating: number; // The numeric rating (e.g., 1-5)
  comment?: string; // Optional text comment
  created_at: string; // Timestamp of when the review was created
  // You might also have user information from a join, e.g., student_name
  student_first_name?: string;
  student_last_name?: string;
}

// Define an interface for the final review object sent to the frontend
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  studentName: string; // Combined student's first and last name
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const teacherId = params.id; // CORRECTED: Use params.id directly
    console.log(`[GET /api/teachers/${teacherId}/reviews] Starting request to fetch teacher reviews.`);

    if (!teacherId) {
      console.warn(`[GET /api/teachers/${teacherId}/reviews] Missing teacher ID in request.`);
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Fetch reviews for the given teacher ID
    // Join with the users table to get the student's name
    const query = `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.first_name AS student_first_name,
        u.last_name AS student_last_name
      FROM reviews r
      JOIN users u ON r.student_id = u.id
      WHERE r.teacher_id = $1
      ORDER BY r.created_at DESC;
    `;

    const result = await db.rawQuery(query, [teacherId]);

    const reviews: Review[] = result.rows.map((rawReview: DbReviewRaw) => ({
      id: rawReview.id,
      rating: rawReview.rating,
      comment: rawReview.comment || undefined,
      createdAt: rawReview.created_at,
      studentName: `${rawReview.student_first_name || ''} ${rawReview.student_last_name || ''}`.trim() || 'Anonymous',
    }));

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    console.log(`[GET /api/teachers/${teacherId}/reviews] Fetched ${reviews.length} reviews. Average rating: ${averageRating.toFixed(2)}`);

    return NextResponse.json({
      reviews: reviews,
      averageRating: parseFloat(averageRating.toFixed(2)), // Ensure it's a number with 2 decimal places
    });

  } catch (error) {
    console.error(`[GET /api/teachers/${params.id}/reviews] Error fetching teacher reviews:`, error);
    // Return a generic error message for security
    return NextResponse.json({ error: "Failed to fetch teacher reviews" }, { status: 500 });
  }
}
