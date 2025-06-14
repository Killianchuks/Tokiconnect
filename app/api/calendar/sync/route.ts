import { NextResponse } from "next/server"
import { syncCalendar } from "@/lib/calendar-sync"

export async function POST(request: Request) {
  try {
    const { calendarType } = await request.json()

    // In a real app, you would sync with the calendar service
    // For demo purposes, we'll just return some mock events
    const events = await syncCalendar(calendarType)

    return NextResponse.json({
      success: true,
      message: `Synced with ${calendarType} calendar`,
      events,
    })
  } catch (error) {
    console.error("Error syncing calendar:", error)
    return NextResponse.json({ error: "Failed to sync calendar" }, { status: 500 })
  }
}
