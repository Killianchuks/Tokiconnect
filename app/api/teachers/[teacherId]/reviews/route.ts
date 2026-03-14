import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { teacherId: string } }) {
  try {
    const teacherId = params.teacherId

    // In a real application, you would fetch this data from your database
    // For now, we'll return an empty array

    return NextResponse.json({
      reviews: [],
      averageRating: 0,
    })
  } catch (error) {
    console.error("Error fetching teacher reviews:", error)
    return NextResponse.json({ error: "Failed to fetch teacher reviews" }, { status: 500 })
  }
}
