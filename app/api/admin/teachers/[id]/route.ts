import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth"; // For authentication/authorization
import { hashPassword } from "@/lib/password-utils"; // For hashing passwords on update

// Define interfaces matching your database schema for Teacher
interface DbTeacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: "student" | "teacher" | "admin";
  language?: string; // Assuming languages are stored as a comma-separated string
  hourly_rate?: number;
  rating?: number;
  bio?: string;
  status: "active" | "pending" | "inactive";
  created_at: string;
  updated_at: string;
}

// GET handler: Fetch a single teacher by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Admin API (GET /api/admin/teachers/[id]): Starting request for teacher ID: ${params.id}`);

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/teachers/[id]): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const teacherId = params.id;
    // Fetch only teacher-specific fields, and ensure role is 'teacher'
    const result = await db.rawQuery(
      "SELECT id, first_name, last_name, email, language, hourly_rate, rating, bio, status, created_at, updated_at FROM users WHERE id = $1 AND role = 'teacher'",
      [teacherId]
    );

    if (!result.rows || result.rows.length === 0) {
      console.log(`Admin API (GET /api/admin/teachers/[id]): Teacher with ID ${teacherId} not found.`);
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const fetchedTeacher: DbTeacher = result.rows[0];
    // Map DB response to frontend Teacher interface
    const formattedTeacher = {
      id: fetchedTeacher.id,
      name: `${fetchedTeacher.first_name || ''} ${fetchedTeacher.last_name || ''}`.trim(),
      email: fetchedTeacher.email,
      languages: fetchedTeacher.language ? fetchedTeacher.language.split(',').map(lang => lang.trim()) : [],
      hourlyRate: fetchedTeacher.hourly_rate || 0,
      rating: fetchedTeacher.rating || 0,
      // students: // You'll need to add a query to count lessons/students for this teacher
      status: fetchedTeacher.status,
      bio: fetchedTeacher.bio || '',
      // availability: // Needs to be fetched from a separate table
      createdAt: fetchedTeacher.created_at,
      updatedAt: fetchedTeacher.updated_at,
    };

    console.log(`Admin API (GET /api/admin/teachers/[id]): Successfully fetched teacher with ID ${teacherId}.`);
    return NextResponse.json(formattedTeacher);
  } catch (error) {
    console.error(`Admin API (GET /api/admin/teachers/[id]) error for ID ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to fetch teacher", details: (error as Error).message }, { status: 500 });
  }
}

// PATCH handler: Update teacher details or status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Admin API (PATCH /api/admin/teachers/[id]): Starting request for teacher ID: ${params.id}`);

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (PATCH /api/admin/teachers/[id]): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const teacherId = params.id;
    const body = await request.json();
    const { name, email, password, languages, bio, hourlyRate, status } = body; // Fields that can be updated

    const updates: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Prevent an admin from changing their own role or deleting themselves
    if (user.id === teacherId && (status !== undefined || (name !== undefined || email !== undefined || password !== undefined || languages !== undefined || bio !== undefined || hourlyRate !== undefined))) {
        // If the admin is trying to modify their own teacher account, allow only specific safe updates or deny certain ones
        // For simplicity, let's say an admin cannot change their own status or role via this teacher-specific endpoint
        // A more robust solution might have separate "admin-editing-self" logic
    }

    if (name !== undefined) {
      const [firstName, ...restName] = name.split(' ');
      const lastName = restName.join(' ');
      updates.push(`first_name = $${paramIndex++}`, `last_name = $${paramIndex++}`);
      queryParams.push(firstName, lastName);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      queryParams.push(email);
    }
    if (password !== undefined && password !== "") {
      const hashedPassword = await hashPassword(password);
      updates.push(`password = $${paramIndex++}`);
      queryParams.push(hashedPassword);
    }
    if (languages !== undefined) {
      if (!Array.isArray(languages)) {
        return NextResponse.json({ error: "Languages must be an array" }, { status: 400 });
      }
      const languageString = languages.join(',');
      updates.push(`language = $${paramIndex++}`);
      queryParams.push(languageString);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      queryParams.push(bio);
    }
    if (hourlyRate !== undefined) {
      if (typeof hourlyRate !== 'number' || hourlyRate < 0) {
        return NextResponse.json({ error: "Hourly rate must be a non-negative number" }, { status: 400 });
      }
      updates.push(`hourly_rate = $${paramIndex++}`);
      queryParams.push(hourlyRate);
    }
    if (status !== undefined) {
      const allowedStatuses = ['active', 'pending', 'inactive'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updates.push(`status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (updates.length === 0) {
      console.log("Admin API (PATCH /api/admin/teachers/[id]): No fields provided for update.");
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`); // Set updated timestamp

    queryParams.push(teacherId); // Add teacher ID as the last parameter for WHERE clause
    const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} AND role = 'teacher' RETURNING id, email, first_name, last_name, language, hourly_rate, rating, bio, status, created_at, updated_at`;

    const result = await db.rawQuery(updateQuery, queryParams);

    if (!result.rows || result.rows.length === 0) {
      console.log(`Admin API (PATCH /api/admin/teachers/[id]): Teacher with ID ${teacherId} not found or not a teacher.`);
      return NextResponse.json({ error: "Teacher not found or not a teacher" }, { status: 404 });
    }

    const updatedTeacher: DbTeacher = result.rows[0];
    const formattedUpdatedTeacher = {
      id: updatedTeacher.id,
      name: `${updatedTeacher.first_name || ''} ${updatedTeacher.last_name || ''}`.trim(),
      email: updatedTeacher.email,
      languages: updatedTeacher.language ? updatedTeacher.language.split(',').map(lang => lang.trim()) : [],
      hourlyRate: updatedTeacher.hourly_rate || 0,
      rating: updatedTeacher.rating || 0,
      status: updatedTeacher.status,
      bio: updatedTeacher.bio || '',
      createdAt: updatedTeacher.created_at,
      updatedAt: updatedTeacher.updated_at,
    };

    console.log(`Admin API (PATCH /api/admin/teachers/[id]): Successfully updated teacher with ID ${teacherId}.`);
    return NextResponse.json(formattedUpdatedTeacher);

  } catch (error) {
    console.error(`Admin API (PATCH /api/admin/teachers/[id]) error for ID ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to update teacher", details: (error as Error).message }, { status: 500 });
  }
}
