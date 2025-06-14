import { NextResponse } from "next/server"
import { importCalendarEvents } from "@/lib/calendar-sync"

export async function POST(request: Request) {
  try {
    const { calendarUrl } = await request.json()

    // In a real app, you would fetch and parse the calendar data
    // For demo purposes, we'll just return some mock events
    const events = await importCalendarEvents(calendarUrl)

    return NextResponse.json({
      success: true,
      message: "Calendar imported successfully",
      events,
    })
  } catch (error) {
    console.error("Error importing calendar:", error)
    return NextResponse.json({ error: "Failed to import calendar" }, { status: 500 })
  }
}
