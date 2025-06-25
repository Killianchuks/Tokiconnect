import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db"; // Assuming your database connection is here
import { buildPaginatedQuery } from "@/lib/db-helpers"; // For pagination

// Define interfaces matching your database schema for Teacher (public view)
interface DbTeacherPublic {
  id: string;
  first_name: string;
  last_name: string;
  email: string; // Consider if email should be public
  language?: string; // Comma-separated string, e.g., "English,Spanish,French"
  hourly_rate?: number;
  rating?: number;
  bio?: string;
  status: "active" | "pending" | "inactive";
}

// GET handler: Fetch a paginated list of ACTIVE teachers (public view)
export async function GET(request: NextRequest) {
  try {
    console.log("Public API (GET /api/teachers): Starting request to fetch active teacher list.");

    // No authentication/authorization needed for this public endpoint

    // Parse URL query parameters for filtering and searching
    const { searchParams } = new URL(request.url);
    // Use .trim() and check for non-empty string to ensure meaningful values
    const searchQuery = searchParams.get("search")?.trim();
    const languageFilter = searchParams.get("language")?.trim();
    const sortBy = searchParams.get("sortBy")?.trim() || "rating"; // Default to sorting by rating for public view
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10);

    // CRITICAL: Only fetch 'active' teachers for the public view
    let baseQuery = "SELECT id, first_name, last_name, email, language, hourly_rate, rating, bio FROM users WHERE role = 'teacher' AND status = 'active'";
    const queryParams: any[] = [];
    const conditions: string[] = [];
    let paramIndex = 1;

    // --- Language Filter Fix (already implemented, re-confirming logic) ---
    // Ensure languageFilter is not "all" and is a non-empty string
    if (languageFilter && languageFilter.toLowerCase() !== "all") {
        conditions.push(`$${paramIndex++} = ANY(string_to_array(TRIM(language), ','))`);
        queryParams.push(languageFilter); // languageFilter is already trimmed
        console.log(`[Public Teachers API] Applying language filter: "${languageFilter}"`);
    }

    // --- CRITICAL SEARCH QUERY FIX ---
    // Only add search condition if searchQuery is a non-empty string
    if (searchQuery) { // This check implicitly handles null, undefined, and empty strings
        conditions.push(`(first_name ILIKE $${paramIndex++} OR last_name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++})`);
        queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
        console.log(`[Public Teachers API] Applying search query: "${searchQuery}"`);
    }
    // --- END CRITICAL SEARCH QUERY FIX ---


    if (conditions.length > 0) {
      baseQuery += " AND " + conditions.join(" AND ");
    }

    // Add ORDER BY clause
    if (sortBy === "hourly_rate_asc") {
        baseQuery += " ORDER BY hourly_rate ASC";
    } else if (sortBy === "hourly_rate_desc") {
        baseQuery += " ORDER BY hourly_rate DESC";
    } else if (sortBy === "name") {
        baseQuery += " ORDER BY first_name ASC, last_name ASC";
    } else { // Default to 'rating'
        baseQuery += " ORDER BY rating DESC NULLS LAST, first_name ASC";
    }

    // Build paginated query
    const { query, params: paginatedParams } = buildPaginatedQuery(baseQuery, page, pageSize, queryParams);
    console.log("Public API (GET /api/teachers): Executing query:", query, "with params:", paginatedParams);

    const result = await db.rawQuery(query, paginatedParams);

    // Get total count (using original query params without pagination)
    const countQuery = "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status = 'active'" + (conditions.length > 0 ? " AND " + conditions.join(" AND ") : "");
    const countResult = await db.rawQuery(countQuery, queryParams);
    const totalCount = Number.parseInt(countResult.rows[0].count, 10);


    // Map DB response to frontend Teacher interface
    const teachers = result.rows.map((teacher: DbTeacherPublic) => ({
      id: teacher.id,
      name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim(),
      email: teacher.email, // Include email if it's publicly viewable
      // Ensure the split and trim correctly handles variations in DB storage (e.g., "English , Spanish")
      languages: teacher.language ? teacher.language.split(',').map(lang => lang.trim()).filter(Boolean) : [], // filter(Boolean) removes empty strings
      hourlyRate: teacher.hourly_rate || 0,
      rating: teacher.rating || 0,
      bio: teacher.bio || '',
      // Do NOT include sensitive fields like status, created_at, updated_at unless necessary for public view
    }));

    console.log(`Public API (GET /api/teachers): Successfully fetched ${teachers.length} active teachers.`);
    return NextResponse.json({
      teachers: teachers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });

  } catch (error) {
    console.error("Public API (GET /api/teachers) error:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
