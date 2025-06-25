import { NextResponse } from "next/server"
import { comparePassword } from "@/lib/password-utils"
import { db } from "@/lib/db"
// CORRECTED IMPORT: Import 'createToken' directly from lib/auth
import { auth, createToken } from "@/lib/auth" // Make sure createToken is imported here
// REMOVED: import { serialize } from 'cookie'; as auth.setAuthCookie handles it

// Define the interface for the user data as it will be used in the application (camelCase)
interface UserData {
  id: string
  email: string
  role: "student" | "teacher" | "admin"
  firstName?: string
  lastName?: string
  name?: string
  language?: string
  hourlyRate?: number // This is camelCase
}

// Define an interface for the user data as it comes directly from the database query result (snake_case)
interface DbUser {
  id: string
  email: string
  password?: string // Assuming password is also present in the DB result
  role: "student" | "teacher" | "admin"
  first_name?: string // This is snake_case
  last_name?: string  // This is snake_case
  name?: string // Potentially from DB if old schema, or combined name
  language?: string
  hourly_rate?: number // This is snake_case
}


export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("Login attempt for:", email)

    // Validate inputs
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, message: "Valid email is required" }, { status: 400 })
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ success: false, message: "Password is required" }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 })
    }

    // Check if database is available (this check might be better handled by your db.ts)
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set")
      return NextResponse.json({ success: false, message: "Database configuration error" }, { status: 500 })
    }

    // Query the database for the user
    try {
      // Ensure db is initialized
      if (!db || typeof db.rawQuery !== "function") {
        throw new Error("Database connection not initialized")
      }

      console.log("🔍 Looking up user in database:", email)
      const result = await db.rawQuery("SELECT * FROM users WHERE email = $1", [email])

      // Check if result is valid
      if (!result || !result.rows) {
        throw new Error("Invalid database response")
      }

      // Explicitly type the 'user' object as DbUser to match database schema
      const user: DbUser | null = result.rows.length > 0 ? result.rows[0] : null

      if (!user) {
        console.log("❌ User not found:", email)
        return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
      }

      console.log("✅ User found:", user.id, "Role:", user.role)

      // Compare the provided password with the stored hash
      // user.password is correctly accessed as it's part of DbUser
      const isPasswordValid = await comparePassword(password, user.password || '') // Added empty string for type safety

      if (!isPasswordValid) {
        console.log("❌ Invalid password for user:", email)
        return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
      }

      console.log("✅ Password valid, login successful")

      // Format user data based on application's UserData interface (camelCase)
      const userData: UserData = {
        id: user.id,
        email: user.email,
        // Type assert the role to be one of the allowed literal types
        role: (user.role || "student") as "student" | "teacher" | "admin",
      }

      // Add name fields based on what's available from DbUser (snake_case from DB, assigned to camelCase in UserData)
      if (user.first_name && user.last_name) {
        userData.firstName = user.first_name
        userData.lastName = user.last_name
        userData.name = `${user.first_name} ${user.last_name}`.trim()
      } else if (user.name) {
        userData.name = user.name
      }

      // Add optional fields if they exist (snake_case from DbUser, assigned to camelCase in UserData)
      if (user.language) userData.language = user.language
      if (user.hourly_rate) userData.hourlyRate = user.hourly_rate // Now correctly matches UserData interface

      console.log("Returning user data with role:", userData.role)

      // Generate the token payload
      // Ensure this payload matches the 'User' interface expected by 'createToken' in lib/auth.ts
      const tokenPayload = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        first_name: userData.firstName, // Pass firstName/lastName if available
        last_name: userData.lastName,
      };

      // CORRECTED CALL: createToken is a directly exported function
      const authToken = await createToken(tokenPayload as any); // Cast to any to temporarily suppress potential User vs UserData mismatch if needed

      // Create a new NextResponse instance
      const response = NextResponse.json({
        success: true,
        user: userData,
        message: "Login successful"
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // CORRECTED CALL: Use auth.setAuthCookie to handle cookie serialization
      auth.setAuthCookie(response, authToken); // Pass the response and the token

      return response;

    } catch (error) {
      console.error("Database error during login:", error)
      return NextResponse.json(
        {
          success: false,
          message: "An error occurred while authenticating",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
