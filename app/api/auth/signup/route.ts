import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  console.log("🔍 Registration API called")

  try {
    // Parse request body
    const body = await request.json()
    console.log(
      "📝 Registration data received:",
      JSON.stringify(
        {
          ...body,
          password: body.password ? "[REDACTED]" : undefined,
        },
        null,
        2,
      ),
    )

    // Extract fields with fallbacks
    const firstName = body.firstName || ""
    const lastName = body.lastName || ""
    const email = body.email || ""
    const password = body.password || ""
    const role = body.role || "student"

    // Additional fields for teachers
    const language = body.language || null
    const hourlyRate = body.hourlyRate || null
    const bio = body.bio || null

    // Validate required fields
    if (!email || !password) {
      console.log("❌ Validation failed: Missing required fields")
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Check if user already exists
    try {
      console.log("🔍 Checking if user already exists:", email)
      const existingUser = await db.rawQuery("SELECT * FROM users WHERE email = $1", [email])

      if (existingUser.rows && existingUser.rows.length > 0) {
        console.log("⚠️ User already exists with this email")
        return NextResponse.json(
          {
            success: false,
            error: "User with this email already exists",
          },
          { status: 409 },
        )
      }
    } catch (checkError) {
      console.error("❌ Error checking existing user:", checkError)
      // Continue with registration attempt even if check fails
    }

    // Hash password
    console.log("🔐 Hashing password")
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create user with exact schema from create-tables.js
    try {
      console.log("➕ Creating new user with schema from create-tables.js")

      // Log the query we're about to execute for debugging
      const query = `
        INSERT INTO users (
          email, 
          first_name, 
          last_name, 
          password, 
          role,
          language,
          hourly_rate,
          bio
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id, email, first_name, last_name, role, language, hourly_rate, bio
      `

      console.log("🔍 Executing query:", query)
      console.log("🔍 With parameters:", [
        email,
        firstName || "User",
        lastName || "",
        hashedPassword,
        role,
        role === "teacher" ? language : null,
        role === "teacher" ? hourlyRate : null,
        role === "teacher" ? bio : null,
      ])

      const result = await db.rawQuery(query, [
        email,
        firstName || "User",
        lastName || "",
        hashedPassword,
        role,
        role === "teacher" ? language : null,
        role === "teacher" ? hourlyRate : null,
        role === "teacher" ? bio : null,
      ])

      const newUser = result.rows[0]
      console.log("✅ User created successfully:", newUser.id)

      return NextResponse.json(
        {
          success: true,
          message: "User registered successfully",
          userId: newUser.id,
          user: {
            id: newUser.id,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            email: newUser.email,
            role: newUser.role,
            language: newUser.language,
            hourlyRate: newUser.hourly_rate,
            bio: newUser.bio,
          },
        },
        { status: 201 },
      )
    } catch (error) {
      console.error("❌ Error creating user:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create user in database",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Unhandled exception in signup route:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
