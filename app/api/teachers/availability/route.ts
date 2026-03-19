import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  try {
    const { teacherId, availability } = await request.json()

    if (!teacherId || !Array.isArray(availability)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Verify user if token exists. For legacy sessions without token,
    // allow update if the target id is a valid teacher account.
    const user = await auth.getCurrentUser(request)

    // Verify user is updating their own availability or is admin
    // Normalize to string to avoid type mismatches (e.g., "1" vs 1)
    if (user && String(user.id) !== String(teacherId) && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!user) {
      const teacherCheck = await db.rawQuery(
        `SELECT id FROM users WHERE id = $1 AND role = 'teacher'`,
        [teacherId],
      )

      if (teacherCheck.rows.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Update the availability in the database
    // availability is stored as JSONB array: [{ day: "Monday", slots: ["9:00 - 10:00"] }]
    const result = await db.rawQuery(
      `UPDATE users 
       SET availability = $1::jsonb, updated_at = NOW() 
       WHERE id = $2 AND role = 'teacher'
       RETURNING id, availability`,
      [JSON.stringify(availability), teacherId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Availability updated successfully",
      availability: result.rows[0].availability
    })
  } catch (error) {
    console.error("Error updating availability:", error)
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 })
    }

    const result = await db.rawQuery(
      `SELECT availability FROM users WHERE id = $1 AND role = 'teacher'`,
      [teacherId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    return NextResponse.json({
      availability: result.rows[0].availability || []
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    )
  }
}
