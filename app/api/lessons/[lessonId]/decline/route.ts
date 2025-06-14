import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { lessonId: string } }) {
  try {
    const lessonId = params.lessonId

    // Update lesson status to declined using raw SQL query
    const updateResult = await db.rawQuery("UPDATE lessons SET status = 'declined' WHERE id = $1 RETURNING id", [
      lessonId,
    ])

    // Check if the lesson was found and updated
    if (!updateResult.rows || updateResult.rows.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error declining lesson:", error)
    return NextResponse.json({ error: "Failed to decline lesson" }, { status: 500 })
  }
}
