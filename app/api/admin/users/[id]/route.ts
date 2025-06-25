import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth"; // For authentication/authorization

// GET handler: Fetch a single user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Admin API (GET /api/admin/users/[id]): Starting request for user ID: ${params.id}`);

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/users/[id]): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const userId = params.id;
    const result = await db.rawQuery("SELECT id, email, first_name, last_name, role, status, language, hourly_rate, created_at, updated_at FROM users WHERE id = $1", [userId]);

    if (!result.rows || result.rows.length === 0) {
      console.log(`Admin API (GET /api/admin/users/[id]): User with ID ${userId} not found.`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format user data from database snake_case to camelCase
    const fetchedUser = result.rows[0];
    const formattedUser = {
      id: fetchedUser.id,
      name: `${fetchedUser.first_name || ''} ${fetchedUser.last_name || ''}`.trim(),
      email: fetchedUser.email,
      role: fetchedUser.role,
      status: fetchedUser.status || "active",
      language: fetchedUser.language,
      hourlyRate: fetchedUser.hourly_rate,
      joinDate: fetchedUser.created_at,
      updatedAt: fetchedUser.updated_at,
    };

    console.log(`Admin API (GET /api/admin/users/[id]): Successfully fetched user with ID ${userId}.`);
    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Admin API (GET /api/admin/users/[id]) error:", error);
    return NextResponse.json({ error: "Failed to fetch user", details: (error as Error).message }, { status: 500 });
  }
}

// PATCH handler: Update user status or other editable fields
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Admin API (PATCH /api/admin/users/[id]): Starting request for user ID: ${params.id}`);

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (PATCH /api/admin/users/[id]): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const userId = params.id;
    const body = await request.json();
    const { status, firstName, lastName, language, hourlyRate, role } = body; // Fields that can be updated

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      queryParams.push(status);
      const allowedStatuses = ['active', 'inactive', 'suspended', 'pending'];
      if (!allowedStatuses.includes(status)) {
        console.log("Admin API (PATCH /api/admin/users/[id]): Invalid status value provided.");
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      // Prevent admin from changing their own status to non-active states if desired
      if (user.id === userId && status !== 'active') {
          console.log("Admin API (PATCH /api/admin/users/[id]): Admin attempted to change their own status to non-active.");
          return new NextResponse(JSON.stringify({ message: "Forbidden: Cannot change your own admin account status to a non-active state." }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
          });
      }
    }
    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      queryParams.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      queryParams.push(lastName);
    }
    if (language !== undefined) {
      updates.push(`language = $${paramIndex++}`);
      queryParams.push(language);
    }
    if (hourlyRate !== undefined) {
      if (typeof hourlyRate !== 'number' || hourlyRate < 0) {
        return NextResponse.json({ error: "Hourly rate must be a non-negative number." }, { status: 400 });
      }
      updates.push(`hourly_rate = $${paramIndex++}`);
      queryParams.push(hourlyRate);
    }
    if (role !== undefined) {
      const allowedRoles = ['student', 'teacher', 'admin'];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
      }
      // Prevent changing your own admin role
      if (user.id === userId && role !== 'admin') {
         console.log("Admin API (PATCH /api/admin/users/[id]): Admin attempted to change their own role.");
         return new NextResponse(JSON.stringify({ message: "Forbidden: Cannot change your own admin account role." }), {
             status: 403,
             headers: { 'Content-Type': 'application/json' }
         });
      }
      updates.push(`role = $${paramIndex++}`);
      queryParams.push(role);
    }

    if (updates.length === 0) {
      console.log("Admin API (PATCH /api/admin/users/[id]): No fields provided for update.");
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);

    queryParams.push(userId); // Add user ID as the last parameter for WHERE clause
    const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, email, status, role, first_name, last_name, language, hourly_rate, created_at, updated_at`;

    const result = await db.rawQuery(updateQuery, queryParams);

    if (!result.rows || result.rows.length === 0) {
      console.log(`Admin API (PATCH /api/admin/users/[id]): User with ID ${userId} not found for update.`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = result.rows[0];
    const formattedUpdatedUser = {
      id: updatedUser.id,
      name: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim(),
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status || "active",
      language: updatedUser.language,
      hourlyRate: updatedUser.hourly_rate,
      joinDate: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    };

    console.log(`Admin API (PATCH /api/admin/users/[id]): Successfully updated user with ID ${userId}.`);
    return NextResponse.json(formattedUpdatedUser);

  } catch (error) {
    console.error("Admin API (PATCH /api/admin/users/[id]) error:", error);
    return NextResponse.json({ error: "Failed to update user", details: (error as Error).message }, { status: 500 });
  }
}

// DELETE handler: Delete a user by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Admin API (DELETE /api/admin/users/[id]): Starting request for user ID: ${params.id}`);

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "admin") {
      console.log("Admin API (DELETE /api/admin/users/[id]): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const userId = params.id;

    // Prevent an admin from deleting their own account
    if (user.id === userId) {
      console.log("Admin API (DELETE /api/admin/users/[id]): Admin attempted to delete their own account.");
      return new NextResponse(JSON.stringify({ message: "Forbidden: Cannot delete your own admin account." }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await db.rawQuery("DELETE FROM users WHERE id = $1 RETURNING id", [userId]);

    if (!result.rows || result.rows.length === 0) {
      console.log(`Admin API (DELETE /api/admin/users/[id]): User with ID ${userId} not found for deletion.`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`Admin API (DELETE /api/admin/users/[id]): Successfully deleted user with ID: ${userId}.`);
    return NextResponse.json({ success: true, id: userId });

  } catch (error) {
    console.error("Admin API (DELETE /api/admin/users/[id]) error:", error);
    return NextResponse.json({ error: "Failed to delete user", details: (error as Error).message }, { status: 500 });
  }
}
