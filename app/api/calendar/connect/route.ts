import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { calendarType } = await request.json()

    // In a real app, this would redirect to OAuth flow
    // For demo purposes, we'll just return a success response
    return NextResponse.json({
      success: true,
      message: `Connected to ${calendarType} calendar`,
    })
  } catch (error) {
    console.error("Error connecting calendar:", error)
    return NextResponse.json({ error: "Failed to connect calendar" }, { status: 500 })
  }
}
