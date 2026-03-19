import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { buildPaginatedQuery } from "@/lib/db-helpers"

async function getAdminUserFromRequest(request: Request) {
  const token = await auth.getAuthCookie()
  let user = token ? auth.verifyToken(token) : null

  if (!user) {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")
    if (userId && userRole === "admin") {
      user = { id: userId, role: userRole }
    }
  }

  return user
}

export async function GET(request: Request) {
  try {
    const user = await getAdminUserFromRequest(request)

    if (!user || user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Parse URL to get query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10)
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const missingProfile = searchParams.get("missingProfile")
    const language = searchParams.get("language")
    const sortBy = searchParams.get("sortBy") || "newest"

    // Build the base query - select specific columns including language
    let baseQuery =
      "SELECT id, email, first_name, last_name, name, role, status, created_at, language, hourly_rate, rating, languages, bio FROM users"
    const queryParams: any[] = []
    const conditions: string[] = []

    // Add filters
    if (role && role !== "all") {
      conditions.push("role = $" + (queryParams.length + 1))
      queryParams.push(role)
    }

    if (status && status !== "all") {
      conditions.push("status = $" + (queryParams.length + 1))
      queryParams.push(status)
    }

    if (search) {
      conditions.push(
        "(email ILIKE $" +
          (queryParams.length + 1) +
          " OR first_name ILIKE $" +
          (queryParams.length + 1) +
          " OR last_name ILIKE $" +
          (queryParams.length + 1) +
          ")",
      )
      queryParams.push(`%${search}%`)
    }

    if (language && language !== "all") {
      // Match against either the primary language field or languages array
      conditions.push(
        "(LOWER(language) = $" +
          (queryParams.length + 1) +
          " OR $" +
          (queryParams.length + 1) +
          " = ANY(languages))",
      )
      queryParams.push(language.toLowerCase())
    }

    const missingFields = (missingProfile || "")
      .split(",")
      .map((field) => field.trim().toLowerCase())
      .filter((field) => field === "language" || field === "price" || field === "bio")

    if (missingFields.includes("language")) {
      conditions.push("(language IS NULL OR TRIM(language) = '')")
    }

    if (missingFields.includes("price")) {
      conditions.push("(hourly_rate IS NULL OR hourly_rate <= 0)")
    }

    if (missingFields.includes("bio")) {
      conditions.push("(bio IS NULL OR TRIM(bio) = '')")
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      baseQuery += " WHERE " + conditions.join(" AND ")
    }

    // Add ORDER BY clause
    if (sortBy === "oldest") {
      baseQuery += " ORDER BY created_at ASC"
    } else if (sortBy === "name") {
      baseQuery += " ORDER BY first_name ASC, last_name ASC"
    } else {
      baseQuery += " ORDER BY created_at DESC"
    }

    // Build the paginated query
    const { query, params } = buildPaginatedQuery(baseQuery, page, pageSize, queryParams)

    // Execute the query
    const result = await db.rawQuery(query, params)

    // Get total count for pagination
    const countQuery =
      "SELECT COUNT(*) FROM users" + (conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "")
    const countResult = await db.rawQuery(countQuery, queryParams)
    const totalCount = Number.parseInt(countResult.rows[0].count, 10)

    // Format the users data
    const users = result.rows.map((user) => {
      // Combine language and languages array
      let userLanguage = user.language || ''
      if (!userLanguage && user.languages && Array.isArray(user.languages) && user.languages.length > 0) {
        userLanguage = user.languages[0]
      }
      
      return {
        id: user.id,
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        role: user.role,
        status: user.status || "active",
        is_active: user.status === "active",
        created_at: user.created_at,
        joinDate: user.created_at,
        language: userLanguage,
        languages: user.languages || [],
        hourly_rate: user.hourly_rate,
        rating: user.rating,
        bio: user.bio || "",
      }
    })

    return NextResponse.json({
      users: users,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    })
  } catch (error) {
    console.error("Admin users API error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAdminUserFromRequest(request)

    if (!user || user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const targetUserId = body?.id as string | undefined

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (String(targetUserId) === String(user.id)) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 })
    }

    const targetUser = await db.rawQuery("SELECT id, role FROM users WHERE id::text = $1::text", [targetUserId])
    if (targetUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (String(targetUser.rows[0]?.role || "").toLowerCase() === "admin") {
      return NextResponse.json({ error: "Admin accounts cannot be deleted" }, { status: 400 })
    }

    const result = await db.rawQuery("DELETE FROM users WHERE id::text = $1::text RETURNING id", [targetUserId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin delete user API error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
