import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password-utils"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, name, email, password, role, language, hourlyRate } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Check if user already exists
    try {
      console.log("Checking if user exists:", email)
      const existingUsers = await db.rawQuery("SELECT * FROM users WHERE email = $1", [email])

      if (existingUsers.rows && existingUsers.rows.length > 0) {
        console.log("User already exists:", email)
        return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
      }
    } catch (error) {
      console.error("Error checking existing user:", error)
      return NextResponse.json({ message: "Error checking user existence" }, { status: 500 })
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create the user
    try {
      console.log("Creating new user:", email, "with role:", role || "student")

      // Use first_name and last_name columns as per your schema
      const first = firstName || (name ? name.split(" ")[0] : "User")
      const last = lastName || (name ? name.split(" ").slice(1).join(" ") : "")

      await db.rawQuery(
        "INSERT INTO users (first_name, last_name, email, password, role, language, hourly_rate) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [first, last, email, hashedPassword, role || "student", language || null, hourlyRate || null],
      )

      console.log("User created successfully:", email)

      return NextResponse.json({
        message: "User registered successfully",
        success: true,
      })
    } catch (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ message: "Error creating user", error: String(error) }, { status: 500 })
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 })
  }
}
