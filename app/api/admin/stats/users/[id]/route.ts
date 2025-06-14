import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET handler for fetching a single user
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const result = await db.rawQuery("SELECT * FROM users WHERE id = ?", [userId])

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// PATCH handler for updating user status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const result = await db.rawQuery("UPDATE users SET status = ? WHERE id = ? RETURNING id, name, email, status", [
      status,
      userId,
    ])

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 })
  }
}

// DELETE handler for deleting a user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const result = await db.rawQuery("DELETE FROM users WHERE id = ? RETURNING id", [userId])

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
