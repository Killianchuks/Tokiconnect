import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs" // Changed from 'bcrypt' to 'bcryptjs'
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    let query = db.select().from(users)

    if (role) {
      query = query.where(eq(users.role, role))
    }

    const allUsers = await query

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
    const existingUsers = await db.select().from(users).where(eq(users.email, email))

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create user
    const newUsers = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role: role || "student",
      })
      .returning()

    const { password: _, ...newUser } = newUsers[0]

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ message: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, first_name, last_name, name, email, language, languages, hourly_rate, bio, password } = body

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    // Build dynamic UPDATE query
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (first_name !== undefined) {
      updates.push(`first_name = $${paramIndex++}`)
      params.push(first_name)
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramIndex++}`)
      params.push(last_name)
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      params.push(name)
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      params.push(email)
    }
    if (language !== undefined) {
      updates.push(`language = $${paramIndex++}`)
      params.push(language)
    }
    if (languages !== undefined) {
      updates.push(`languages = $${paramIndex++}`)
      params.push(languages)
    }
    if (hourly_rate !== undefined) {
      updates.push(`hourly_rate = $${paramIndex++}`)
      params.push(hourly_rate)
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`)
      params.push(bio)
    }
    if (password !== undefined) {
      const hashedPassword = await bcryptjs.hash(password, 10)
      updates.push(`password = $${paramIndex++}`)
      params.push(hashedPassword)
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 })
    }

    // Add the user ID as the last parameter
    params.push(id)

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, email, first_name, last_name, name, role, language, hourly_rate, bio`
    
    const result = await db.rawQuery(query, params)

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ message: "Failed to update user", error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    const deletedUsers = await db.delete(users).where(eq(users.id, id)).returning()

    if (deletedUsers.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 })
  }
}
