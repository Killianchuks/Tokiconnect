import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth"; // For authentication/authorization
import { buildPaginatedQuery } from "@/lib/db-helpers"; // For pagination logic
import { hashPassword } from "@/lib/password-utils"; // For hashing passwords on create

// GET handler: Fetch a paginated list of users with optional filters
export async function GET(request: NextRequest) {
  try {
    console.log("Admin API (GET /api/admin/users): Starting request to fetch user list.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/users): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    // Parse URL query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10);
    const role = searchParams.get("role"); // Filter by user role (student, teacher, admin)
    const status = searchParams.get("status"); // Filter by user status (active, inactive, suspended)
    const search = searchParams.get("search"); // Search by email, first_name, last_name
    const sortBy = searchParams.get("sortBy") || "newest"; // Sorting option

    let baseQuery = "SELECT id, email, first_name, last_name, role, status, language, hourly_rate, created_at, updated_at FROM users";
    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Apply filters based on query parameters
    if (role && role !== "all") {
      conditions.push("role = $" + (queryParams.length + 1));
      queryParams.push(role);
    }
    if (status && status !== "all") {
      conditions.push("status = $" + (queryParams.length + 1));
      queryParams.push(status);
    }
    if (search) {
      // Case-insensitive search across multiple columns
      conditions.push(
        "(email ILIKE $" + (queryParams.length + 1) +
        " OR first_name ILIKE $" + (queryParams.length + 1) +
        " OR last_name ILIKE $" + (queryParams.length + 1) + ")"
      );
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`); // Add param for each ILIKE
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      baseQuery += " WHERE " + conditions.join(" AND ");
    }

    // Add ORDER BY clause
    if (sortBy === "oldest") {
      baseQuery += " ORDER BY created_at ASC";
    } else if (sortBy === "name") {
      baseQuery += " ORDER BY first_name ASC, last_name ASC";
    } else { // Default to 'newest'
      baseQuery += " ORDER BY created_at DESC";
    }

    // Build paginated query using the helper function
    const { query, params } = buildPaginatedQuery(baseQuery, page, pageSize, queryParams);
    console.log("Admin API (GET /api/admin/users): Executing query:", query, "with params:", params);

    // Execute the paginated query to get users
    const result = await db.rawQuery(query, params);

    // Get total count of users matching filters for pagination metadata
    const countQuery = "SELECT COUNT(*) FROM users" + (conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "");
    const countResult = await db.rawQuery(countQuery, queryParams);
    const totalCount = Number.parseInt(countResult.rows[0].count, 10);

    // Format user data from database snake_case to camelCase for API response
    const users = result.rows.map((user: any) => ({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email,
      role: user.role,
      status: user.status || "active", // Default status if not explicitly set
      language: user.language,
      hourlyRate: user.hourly_rate, // For teachers
      joinDate: user.created_at,
      updatedAt: user.updated_at,
    }));

    console.log("Admin API (GET /api/admin/users): Successfully fetched user list.");
    return NextResponse.json({
      users: users,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });

  } catch (error) {
    console.error("Admin API (GET /api/admin/users) error:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


// POST handler: Create a new user
export async function POST(request: NextRequest) {
  try {
    console.log("Admin API (POST /api/admin/users): Starting request to create a new user.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (POST /api/admin/users): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const body = await request.json();
    const { firstName, lastName, email, password, role, language, hourlyRate } = body;

    // Basic input validation
    if (!firstName || !lastName || !email || !password || !role) {
      console.log("Admin API (POST /api/admin/users): Missing required fields.");
      return new NextResponse(JSON.stringify({ message: "Missing required fields (firstName, lastName, email, password, role)" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash the password before storing
    const hashedPassword = await hashPassword(password);

    // Prepare query parameters based on role
    let insertQuery = "INSERT INTO users (first_name, last_name, email, password, role";
    let insertValues = ["$1", "$2", "$3", "$4", "$5"];
    const queryParams = [firstName, lastName, email, hashedPassword, role];

    if (role === 'teacher') {
      if (typeof hourlyRate !== 'number' || hourlyRate <= 0) {
        console.log("Admin API (POST /api/admin/users): Invalid hourlyRate for teacher.");
        return new NextResponse(JSON.stringify({ message: "Hourly rate is required and must be a positive number for teachers." }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      insertQuery += ", language, hourly_rate";
      insertValues.push("$6", "$7");
      queryParams.push(language, hourlyRate);
    } else if (role === 'student') {
        insertQuery += ", language";
        insertValues.push("$6");
        queryParams.push(language);
    }

    insertQuery += ") VALUES (" + insertValues.join(", ") + ") RETURNING id, email, role, first_name, last_name";

    // Execute the insert query
    const result = await db.rawQuery(insertQuery, queryParams);

    if (!result.rows || result.rows.length === 0) {
      console.error("Admin API (POST /api/admin/users): User creation failed, no row returned.");
      return new NextResponse(JSON.stringify({ message: "Failed to create user" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newUser = result.rows[0];
    console.log(`Admin API (POST /api/admin/users): Successfully created user with ID: ${newUser.id}`);
    return new NextResponse(JSON.stringify({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
      }
    }), {
      status: 201, // 201 Created
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Admin API (POST /api/admin/users) error:", error);
    // Check for duplicate email error from database
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
      return new NextResponse(JSON.stringify({ message: "Email already in use." }), {
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
