import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId } = await params

    const { rating, feedback, teacherId } = await request.json()
    const userId = session.user.id

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating. Must be between 1 and 5." }, { status: 400 })
    }

    // In a real application, you would save this to your database
    // For example:
    // await db.insert(reviews).values({
    //   userId,
    //   teacherId,
    //   lessonId,
    //   rating,
    //   feedback,
    //   createdAt: new Date()
    // })

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting rating:", error)
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 })
  }
}
