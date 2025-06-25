import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth";

// Define an interface for Commission Settings as expected by the frontend
interface CommissionSettings {
  standard: number;
  premium: number;
  newTeacher: number;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Admin API (GET /api/admin/commission-settings): Starting request to fetch commission settings.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (GET /api/admin/commission-settings): Unauthorized access attempt to fetch settings.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    // In a real application, you would fetch these from a 'settings' or 'commission_rates' table in your database.
    // For now, return a default set of values.
    // Example: SELECT standard_rate, premium_rate, new_teacher_rate FROM commission_rates LIMIT 1;
    // Or if stored as key-value pairs: SELECT key, value FROM settings WHERE key IN ('standard_commission', ...)

    // Placeholder data - replace with DB fetch logic
    const settings: CommissionSettings = {
      standard: 12,
      premium: 10,
      newTeacher: 8,
    };

    // If fetching from DB, it might look something like this:
    /*
    const result = await db.rawQuery(`SELECT standard_rate, premium_rate, new_teacher_rate FROM commission_rates LIMIT 1`);
    if (result.rows.length > 0) {
      settings.standard = parseFloat(result.rows[0].standard_rate);
      settings.premium = parseFloat(result.rows[0].premium_rate);
      settings.newTeacher = parseFloat(result.rows[0].new_teacher_rate);
    }
    */

    console.log("Admin API (GET /api/admin/commission-settings): Successfully fetched commission settings.");
    return NextResponse.json(settings);

  } catch (error) {
    console.error("[ADMIN_COMMISSION_SETTINGS] Error fetching commission settings:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("Admin API (PUT /api/admin/commission-settings): Starting request to update commission settings.");

    // --- AUTHENTICATION & AUTHORIZATION ---
    const user: User | null = await auth.getCurrentUser(request);

    if (!user || user.role !== "admin") {
      console.log("Admin API (PUT /api/admin/commission-settings): Unauthorized access attempt to update settings.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- END AUTHENTICATION & AUTHORIZATION ---

    const body = await request.json();
    const { standard, premium, newTeacher } = body;

    // Validate incoming data
    if (typeof standard !== 'number' || typeof premium !== 'number' || typeof newTeacher !== 'number' ||
        standard < 0 || standard > 100 || premium < 0 || premium > 100 || newTeacher < 0 || newTeacher > 100) {
      return new NextResponse(JSON.stringify({ message: "Invalid commission values. Must be numbers between 0 and 100." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // In a real application, you would update these in your 'settings' or 'commission_rates' table.
    // Example: UPDATE commission_rates SET standard_rate = $1, premium_rate = $2, new_teacher_rate = $3;
    // For now, this is a simulated update.
    console.log("Simulating update for commission settings:", { standard, premium, newTeacher });

    console.log("Admin API (PUT /api/admin/commission-settings): Successfully updated commission settings.");
    return NextResponse.json({ message: "Commission settings updated successfully.", standard, premium, newTeacher });

  } catch (error) {
    console.error("[ADMIN_COMMISSION_SETTINGS] Error updating commission settings:", error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
