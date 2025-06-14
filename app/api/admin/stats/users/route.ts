import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { buildPaginatedQuery } from "@/lib/db-helpers"

export async function GET(request: Request) {
  try {
    console.log("Admin users API: Starting request")

    try {
      const testConnection = await db.testConnection()
      console.log("Database connection test:", testConnection)
    } catch (error) {
      console.error("Database connection test failed:", error)
    }

    // Get the auth token and verify it
    const token = await auth.getAuthCookie()
    console.log("Admin users API: Auth token present:", !!token)

    const user = token ? auth.verifyToken(token) : null
    console.log("Admin users API: Verified user:", user ? { id: user.id, role: user.role } : "No user")

    if (!user || user.role !== "admin") {
      console.log("Admin users API: Unauthorized access attempt", user ? `User role: ${user.role}` : "No user")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Parse URL to get query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10)
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "newest"

    // Build the base query
    let baseQuery = "SELECT * FROM users"
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

    console.log("Admin users API: Executing query", query, params)

    // Execute the query
    const result = await db.rawQuery(query, params)

    console.log("Admin users API: Query results", result.rows)

    // Get total count for pagination
    const countQuery =
      "SELECT COUNT(*) FROM users" + (conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "")
    const countResult = await db.rawQuery(countQuery, queryParams)
    const totalCount = Number.parseInt(countResult.rows[0].count, 10)

    // Format the users data
    const users = result.rows.map((user) => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      status: user.status || "active",
      joinDate: user.created_at,
      language: user.language,
      rating: user.rating,
    }))

    console.log("Admin users API: Successfully fetched users")

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
