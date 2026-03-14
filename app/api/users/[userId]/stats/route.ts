import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Define interfaces for our data
interface UserStats {
  totalLessons: number
  totalTeachers: number
  totalSpent: number
  averageRating: number
}

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    // Check if the user exists
    const userResult = await db.rawQuery("SELECT id FROM users WHERE id = $1", [userId])

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Default stats
    const stats: UserStats = {
      totalLessons: 0,
      totalTeachers: 0,
      totalSpent: 0,
      averageRating: 0,
    }

    try {
      // Get total lessons
      const lessonsCountResult = await db.rawQuery(
        "SELECT COUNT(*) as count FROM lessons WHERE student_id = $1 AND status = 'completed'",
        [userId],
      )
      stats.totalLessons = Number.parseInt(lessonsCountResult.rows[0]?.count, 10) || 0

      // Get unique teachers
      const uniqueTeachersResult = await db.rawQuery(
        "SELECT COUNT(DISTINCT teacher_id) as count FROM lessons WHERE student_id = $1",
        [userId],
      )
      stats.totalTeachers = Number.parseInt(uniqueTeachersResult.rows[0]?.count, 10) || 0

      // Get total spent
      const transactionsResult = await db.rawQuery(
        "SELECT amount FROM transactions WHERE user_id = $1 AND type = 'payment'",
        [userId],
      )

      if (transactionsResult.rows && transactionsResult.rows.length > 0) {
        stats.totalSpent = transactionsResult.rows.reduce(
          (total: number, transaction: any) => total + (Number.parseFloat(transaction.amount) || 0),
          0,
        )
      }

      // Get average rating
      const ratingsResult = await db.rawQuery(
        `SELECT r.rating 
         FROM ratings r
         JOIN lessons l ON r.lesson_id = l.id
         WHERE l.student_id = $1`,
        [userId],
      )

      if (ratingsResult.rows && ratingsResult.rows.length > 0) {
        const totalRating = ratingsResult.rows.reduce(
          (sum: number, rating: any) => sum + (Number.parseFloat(rating.rating) || 0),
          0,
        )
        stats.averageRating = totalRating / ratingsResult.rows.length
      }
    } catch (error) {
      console.error("Error calculating user stats:", error)
      // Continue with default stats
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching user stats:", error)
    // Return default stats instead of error
    return NextResponse.json({
      totalLessons: 0,
      totalTeachers: 0,
      totalSpent: 0,
      averageRating: 0,
    })
  }
}
