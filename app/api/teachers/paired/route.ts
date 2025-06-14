import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // In a real app, this would fetch from a database
    // For now, we'll return an empty array
    return NextResponse.json([])
  } catch (error) {
    console.error("Error fetching paired teachers:", error)
    return NextResponse.json({ error: "Failed to fetch paired teachers" }, { status: 500 })
  }
}
