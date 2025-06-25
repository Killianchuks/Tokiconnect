import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db"; // Assuming your database connection is here
import { auth, User } from "@/lib/auth"; // For authentication/authorization
import { buildPaginatedQuery } from "@/lib/db-helpers"; // For pagination (if needed for teachers list)
import { hashPassword } from "@/lib/password-utils"; // For hashing passwords on create

// Define interfaces matching your database schema for Teacher
// Note: Frontend Teacher interface might differ slightly (e.g., camelCase vs snake_case)
interface DbTeacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string; // Only when creating/updating password
  role: "student" | "teacher" | "admin";
  language?: string; // In DB, languages might be comma-separated or linked via a join table
  hourly_rate?: number;
  rating?: number;
  bio?: string;
  status: "active" | "pending" | "inactive";
  created_at: string;
  updated_at: string;
  // Add other fields from your users table related to teachers
}

// GET handler: Fetch a paginated list of teachers with optional filters (for admin view)
export async function GET(request: NextRequest) {
  try {
    console.log("Admin API (GET /api/admin/teachers): Starting request to fetch teacher list.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/teachers): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    // Parse URL query parameters for filtering and searching
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");
    const languageFilter = searchParams.get("language");
    const statusFilter = searchParams.get("status"); // e.g., 'active', 'pending', 'inactive'
    const sortBy = searchParams.get("sortBy") || "newest"; // 'newest', 'oldest', 'name', 'rating'
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10);


    let baseQuery = "SELECT id, first_name, last_name, email, language, hourly_rate, rating, status, bio, created_at, updated_at FROM users WHERE role = 'teacher'";
    const queryParams: any[] = [];
    const conditions: string[] = [];
    let paramIndex = 1;

    if (languageFilter && languageFilter !== "all") {
        conditions.push(`language ILIKE $${paramIndex++}`); // Assuming language is a string or array in DB
        queryParams.push(`%${languageFilter}%`);
    }
    if (statusFilter && statusFilter !== "all") {
        conditions.push(`status = $${paramIndex++}`);
        queryParams.push(statusFilter);
    }
    if (searchQuery) {
        // Search by name or email
        conditions.push(`(first_name ILIKE $${paramIndex++} OR last_name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++})`);
        queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    if (conditions.length > 0) {
      baseQuery += " AND " + conditions.join(" AND "); // Use AND because role='teacher' is already there
    }

    // Add ORDER BY clause
    if (sortBy === "oldest") {
      baseQuery += " ORDER BY created_at ASC";
    } else if (sortBy === "name") {
      baseQuery += " ORDER BY first_name ASC, last_name ASC";
    } else if (sortBy === "rating") {
        baseQuery += " ORDER BY rating DESC NULLS LAST"; // Teachers with higher rating first, nulls last
    } else { // Default to 'newest'
      baseQuery += " ORDER BY created_at DESC";
    }

    // Build paginated query
    const { query, params: paginatedParams } = buildPaginatedQuery(baseQuery, page, pageSize, queryParams);
    console.log("Admin API (GET /api/admin/teachers): Executing query:", query, "with params:", paginatedParams);

    const result = await db.rawQuery(query, paginatedParams);

    // Get total count (using original query params without pagination)
    const countQuery = "SELECT COUNT(*) FROM users WHERE role = 'teacher'" + (conditions.length > 0 ? " AND " + conditions.join(" AND ") : "");
    const countResult = await db.rawQuery(countQuery, queryParams);
    const totalCount = Number.parseInt(countResult.rows[0].count, 10);


    // Map DB response to frontend Teacher interface
    const teachers = result.rows.map((teacher: DbTeacher) => ({
      id: teacher.id,
      name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim(),
      email: teacher.email,
      languages: teacher.language ? teacher.language.split(',').map(lang => lang.trim()) : [], // Assuming comma-separated languages
      hourlyRate: teacher.hourly_rate || 0,
      rating: teacher.rating || 0,
      // availability: [], // You'll need to fetch this from a separate table if it exists
      status: teacher.status,
      bio: teacher.bio || '',
      // students: will need to be calculated via another query if a 'lessons' or 'students_teachers' table exists
    }));

    console.log("Admin API (GET /api/admin/teachers): Successfully fetched teacher list.");
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
    console.error("Admin API (GET /api/admin/teachers) error:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST handler: Create a new teacher
export async function POST(request: NextRequest) {
  try {
    console.log("Admin API (POST /api/admin/teachers): Starting request to create a new teacher.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (POST /api/admin/teachers): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const body = await request.json();
    const { name, email, password, languages, bio, hourlyRate } = body;

    // Basic input validation
    if (!name || !email || !password || !languages || languages.length === 0 || typeof hourlyRate !== 'number' || hourlyRate <= 0) {
      console.log("Admin API (POST /api/admin/teachers): Missing required fields or invalid hourly rate.");
      return new NextResponse(JSON.stringify({ message: "Missing required fields (name, email, password, languages, hourlyRate must be > 0)" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const [firstName, ...restName] = name.split(' ');
    const lastName = restName.join(' ');

    const hashedPassword = await hashPassword(password);
    const languageString = languages.join(','); // Store languages as comma-separated string

    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, password, role, language, hourly_rate, bio, status)
      VALUES ($1, $2, $3, $4, 'teacher', $5, $6, $7, 'active')
      RETURNING id, email, first_name, last_name, language, hourly_rate, status
    `;
    const queryParams = [firstName, lastName, email, hashedPassword, languageString, hourlyRate, bio];

    const result = await db.rawQuery(insertQuery, queryParams);

    if (!result.rows || result.rows.length === 0) {
      console.error("Admin API (POST /api/admin/teachers): Teacher creation failed, no row returned.");
      return new NextResponse(JSON.stringify({ message: "Failed to create teacher" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newTeacher = result.rows[0];
    console.log(`Admin API (POST /api/admin/teachers): Successfully created teacher with ID: ${newTeacher.id}`);
    return new NextResponse(JSON.stringify({
      message: "Teacher created successfully",
      teacher: {
        id: newTeacher.id,
        name: `${newTeacher.first_name} ${newTeacher.last_name}`,
        email: newTeacher.email,
        languages: newTeacher.language ? newTeacher.language.split(',').map((l: string) => l.trim()) : [],
        hourlyRate: newTeacher.hourly_rate,
        status: newTeacher.status,
      }
    }), {
      status: 201, // 201 Created
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Admin API (POST /api/admin/teachers) error:", error);
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
      return new NextResponse(JSON.stringify({ message: "Email already in use for a teacher." }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
