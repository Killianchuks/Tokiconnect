import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs" // Using bcryptjs instead of bcrypt
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    let query = "SELECT * FROM users"
    const params: any[] = []

    if (role) {
      query += " WHERE role = $1"
      params.push(role)
    }

    const result = await db.rawQuery(query, params)
    const allUsers = result.rows || []

    // Remove sensitive information
    const safeUsers = allUsers.map((user) => {
      const { password, ...safeUser } = user
      return safeUser
    })

    return NextResponse.json(safeUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    // Check if user already exists
    const existingUsersResult = await db.rawQuery("SELECT * FROM users WHERE email = $1", [email])
    const existingUsers = existingUsersResult.rows || []

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create user - split name into first_name and last_name if provided as a single field
    let firstName = name
    let lastName = ""

    if (name && name.includes(" ")) {
      const nameParts = name.split(" ")
      firstName = nameParts[0]
      lastName = nameParts.slice(1).join(" ")
    }

    const result = await db.rawQuery(
      "INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [firstName, lastName, email, hashedPassword, role || "student"],
    )

    const newUser = result.rows[0]
    const { password: _, ...safeUser } = newUser

    return NextResponse.json(safeUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ message: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcryptjs.hash(updateData.password, 10)
    }

    // Build the update query dynamically based on the fields provided
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(updateData).forEach(([key, value]) => {
      updateFields.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    })

    values.push(id) // Add id as the last parameter

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `

    const result = await db.rawQuery(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const updatedUser = result.rows[0]
    const { password: _, ...safeUser } = updatedUser

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    const result = await db.rawQuery("DELETE FROM users WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 })
  }
}
