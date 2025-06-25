// app/api/teachers/me/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth, User } from "@/lib/auth";

interface DbTeacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: "student" | "teacher" | "admin";
  language?: string;
  hourly_rate?: number;
  rating?: number;
  bio?: string;
  status: "active" | "pending" | "inactive";
  created_at: string;
  updated_at: string;
  free_demo_available?: boolean;
  free_demo_duration?: number;
  availability?: string; // Expecting JSON string from DB
  discounts?: string;   // Expecting JSON string from DB
  trial_class_available?: boolean;
  trial_class_price?: number;
  default_meeting_link?: string; // ADDED: New field for meeting link
}

interface FormattedTeacherAvailability {
  day: string;
  slots: string[];
}

interface FormattedTeacherDiscounts {
  monthly4: number;
  monthly8: number;
  monthly12: number;
}

// Helper to parse JSONB columns safely
const parseJsonb = (jsonbString: string | null | undefined) => { // Updated to accept undefined
  if (!jsonbString) return null;
  try {
    return JSON.parse(jsonbString);
  } catch (e) {
    console.error("Error parsing JSONB:", e);
    return null;
  }
};


// GET handler: Fetch the current authenticated teacher's profile
export async function GET(request: NextRequest) {
  try {
    console.log("Teacher API (GET /api/teachers/me): Starting request to fetch current teacher's profile.");

    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "teacher") {
      console.log("Teacher API (GET /api/teachers/me): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teacherId = user.id;

    const result = await db.rawQuery(
      `SELECT
        id, first_name, last_name, email, language, hourly_rate, rating, bio, status, created_at, updated_at
        , free_demo_available
        , free_demo_duration
        , availability::text as availability_json -- Cast JSONB to text for retrieval
        , discounts::text as discounts_json      -- Cast JSONB to text for retrieval
        , trial_class_available
        , trial_class_price
        , default_meeting_link -- ADDED: Select the new column
      FROM users
      WHERE id = $1 AND role = 'teacher'`,
      [teacherId]
    );

    if (!result.rows || result.rows.length === 0) {
      console.log(`Teacher API (GET /api/teachers/me): Teacher profile not found for ID: ${teacherId}.`);
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Use a generic row type for direct DB access, then map to DbTeacher
    const fetchedRow: any = result.rows[0];

    let parsedAvailability: FormattedTeacherAvailability[] = [];
    // Use availability_json (text cast) from fetchedRow
    if (fetchedRow.availability_json) {
      try {
        parsedAvailability = JSON.parse(fetchedRow.availability_json);
        if (!Array.isArray(parsedAvailability)) {
            console.warn(`[Backend API /me GET] Availability fetched for ${teacherId} is not an array:`, parsedAvailability);
            parsedAvailability = [];
        }
        console.log(`[Backend API /me GET] Parsed Availability: ${JSON.stringify(parsedAvailability)}`);
      } catch (e) {
        console.error(`[Backend API /me GET] Error parsing availability JSON for teacher ${teacherId}:`, e);
        parsedAvailability = [];
      }
    }

    let parsedDiscounts: FormattedTeacherDiscounts = { monthly4: 0, monthly8: 0, monthly12: 0 };
    // Use discounts_json (text cast) from fetchedRow
    if (fetchedRow.discounts_json) {
        try {
            parsedDiscounts = JSON.parse(fetchedRow.discounts_json);
            if (typeof parsedDiscounts !== 'object' || parsedDiscounts === null) {
                console.warn(`[Backend API /me GET] Discounts fetched for ${teacherId} is not an object:`, parsedDiscounts);
                parsedDiscounts = { monthly4: 0, monthly8: 0, monthly12: 0 };
            }
            console.log(`[Backend API /me GET] Parsed Discounts: ${JSON.stringify(parsedDiscounts)}`);
        } catch (e) {
            console.error(`[Backend API /me GET] Error parsing discounts JSON for teacher ${teacherId}:`, e);
            parsedDiscounts = { monthly4: 0, monthly8: 0, monthly12: 0 };
        }
    }


    const formattedTeacher = {
      id: fetchedRow.id,
      name: `${fetchedRow.first_name || ''} ${fetchedRow.last_name || ''}`.trim(),
      email: fetchedRow.email,
      languages: fetchedRow.language ? fetchedRow.language.split(',').map((lang: string) => lang.trim()) : [],
      hourlyRate: parseFloat(fetchedRow.hourly_rate || 0), // Ensure it's a number
      rating: parseFloat(fetchedRow.rating || 0), // Ensure it's a number
      bio: fetchedRow.bio || '',
      status: fetchedRow.status,
      createdAt: fetchedRow.created_at,
      updatedAt: fetchedRow.updated_at,
      freeDemoAvailable: fetchedRow.free_demo_available === true,
      freeDemoDuration: parseInt(fetchedRow.free_demo_duration || 0), // Ensure it's a number
      availability: parsedAvailability,
      discounts: parsedDiscounts,
      trialClassAvailable: fetchedRow.trial_class_available === true,
      trialClassPrice: parseFloat(fetchedRow.trial_class_price || 0), // Ensure it's a number
      defaultMeetingLink: fetchedRow.default_meeting_link || null, // ADDED: Include the new field
    };

    console.log(`Teacher API (GET /api/teachers/me): Successfully fetched profile for teacher ID: ${teacherId}.`);
    console.log(`Teacher API (GET /api/teachers/me): Fetched freeDemoAvailable: ${formattedTeacher.freeDemoAvailable}, freeDemoDuration: ${formattedTeacher.freeDemoDuration}, defaultMeetingLink: ${formattedTeacher.defaultMeetingLink}`); // ADDED: Log new field
    console.log(`Teacher API (GET /api/teachers/me): Formatted Availability (for frontend): ${JSON.stringify(formattedTeacher.availability)}`);
    console.log(`Teacher API (GET /api/teachers/me): Formatted Discounts (for frontend): ${JSON.stringify(formattedTeacher.discounts)}`);
    return NextResponse.json(formattedTeacher);

  } catch (error) {
    console.error("Teacher API (GET /api/teachers/me) error:", error);
    return NextResponse.json({ error: "Failed to fetch teacher profile", details: (error as Error).message }, { status: 500 });
  }
}

// PATCH handler: Update the current authenticated teacher's profile
export async function PATCH(request: NextRequest) {
  try {
    console.log("Teacher API (PATCH /api/teachers/me): Starting request to update current teacher's profile.");

    const user: User | null = await auth.getCurrentUser(request);
    if (!user || user.role !== "teacher") {
      console.log("Teacher API (PATCH /api/teachers/me): Unauthorized access attempt.");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teacherId = user.id;
    const body = await request.json();

    console.log("Teacher API (PATCH /api/teachers/me): Raw request body:", JSON.stringify(body, null, 2));

    const {
      firstName,
      lastName,
      languages,
      bio,
      hourlyRate,
      free_demo_available,
      free_demo_duration,
      availability,
      discounts,
      trialClassAvailable,
      trialClassPrice,
      default_meeting_link, // FIXED: Changed from defaultMeetingLink to default_meeting_link
    } = body;

    console.log(`Teacher API (PATCH /api/teachers/me): Destructured free_demo_available: ${free_demo_available} (type: ${typeof free_demo_available})`);
    console.log(`Teacher API (PATCH /api/teachers/me): Destructured free_demo_duration: ${free_demo_duration} (type: ${typeof free_demo_duration})`);
    console.log(`Teacher API (PATCH /api/teachers/me): Destructured availability (from payload): ${JSON.stringify(availability)} (type: ${typeof availability})`);
    console.log(`Teacher API (PATCH /api/teachers/me): Destructured discounts (from payload): ${JSON.stringify(discounts)} (type: ${typeof discounts})`);
    console.log(`Teacher API (PATCH /api/teachers/me): Destructured default_meeting_link (from payload): ${default_meeting_link} (type: ${typeof default_meeting_link})`); // FIXED: Log new field


    const updates: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) { updates.push(`first_name = $${paramIndex++}`); queryParams.push(firstName); }
    if (lastName !== undefined) { updates.push(`last_name = $${paramIndex++}`); queryParams.push(lastName); }
    if (languages !== undefined) {
      if (!Array.isArray(languages)) { return NextResponse.json({ error: "Languages must be an array" }, { status: 400 }); }
      updates.push(`language = $${paramIndex++}`); queryParams.push(languages.join(','));
    }
    if (bio !== undefined) { updates.push(`bio = $${paramIndex++}`); queryParams.push(bio); }
    if (hourlyRate !== undefined) {
      if (typeof hourlyRate !== 'number' || hourlyRate < 0) { return NextResponse.json({ error: "Hourly rate must be a non-negative number" }, { status: 400 }); }
      updates.push(`hourly_rate = $${paramIndex++}`); queryParams.push(hourlyRate);
    }

    if (availability !== undefined) {
      if (!Array.isArray(availability)) {
        console.warn(`[Backend API /me PATCH] Received non-array availability. Skipping update.`);
      } else {
        updates.push(`availability = $${paramIndex++}::jsonb`); // Explicitly cast to jsonb
        queryParams.push(JSON.stringify(availability));
        console.log(`[Backend API /me PATCH] Availability being stringified and added to update: ${JSON.stringify(availability)}`);
      }
    }
    if (discounts !== undefined) {
      if (typeof discounts !== 'object' || discounts === null) {
        console.warn(`[Backend API /me PATCH] Received non-object discounts. Skipping update.`);
      } else {
        updates.push(`discounts = $${paramIndex++}::jsonb`); // Explicitly cast to jsonb
        queryParams.push(JSON.stringify(discounts));
        console.log(`[Backend API /me PATCH] Discounts being stringified and added to update: ${JSON.stringify(discounts)}`);
      }
    }

    if (trialClassAvailable !== undefined) { updates.push(`trial_class_available = $${paramIndex++}`); queryParams.push(trialClassAvailable); }
    if (trialClassPrice !== undefined) { updates.push(`trial_class_price = $${paramIndex++}`); queryParams.push(trialClassPrice); }
    if (typeof free_demo_available === 'boolean') { updates.push(`free_demo_available = $${paramIndex++}`); queryParams.push(free_demo_available); }
    if (typeof free_demo_duration === 'number' && free_demo_duration >= 0) { updates.push(`free_demo_duration = $${paramIndex++}`); queryParams.push(free_demo_duration); }

    if (default_meeting_link !== undefined) { // FIXED: Use default_meeting_link here
      updates.push(`default_meeting_link = $${paramIndex++}`);
      queryParams.push(default_meeting_link);
    }


    if (updates.length === 0) {
      console.log("Teacher API (PATCH /api/teachers/me): No fields provided for update.");
      return NextResponse.json({ message: "No fields to update" }, { status: 200 }); // Changed to 200 for no changes
    }

    updates.push(`updated_at = NOW()`);

    queryParams.push(teacherId); // Teacher ID is always the last parameter for WHERE clause
    const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} AND role = 'teacher'
    RETURNING id, email, first_name, last_name, language, hourly_rate, rating, bio, status, created_at, updated_at
    , free_demo_available, free_demo_duration
    , availability::text as availability_json
    , discounts::text as discounts_json
    , trial_class_available, trial_class_price
    , default_meeting_link -- ADDED: Return new field
    `;

    console.log("Teacher API (PATCH /api/teachers/me): Final Update Query:", updateQuery);
    console.log("Teacher API (PATCH /api/teachers/me): Final Query Params (before execution):", queryParams);


    const result = await db.rawQuery(updateQuery, queryParams);

    if (!result.rows || result.rows.length === 0) {
      console.log(`Teacher API (PATCH /api/teachers/me): Teacher profile not found or not a teacher for ID: ${teacherId}.`);
      return NextResponse.json({ error: "Teacher profile not found or not authorized" }, { status: 404 });
    }

    const updatedFetchedRow: any = result.rows[0];

    let returnedParsedAvailability: FormattedTeacherAvailability[] = [];
    if (updatedFetchedRow.availability_json) {
        try {
            returnedParsedAvailability = JSON.parse(updatedFetchedRow.availability_json);
            if (!Array.isArray(returnedParsedAvailability)) { returnedParsedAvailability = []; }
        } catch (e) { console.error(`[Backend API /me PATCH] Error parsing returned availability:`, e); }
    }

    let returnedParsedDiscounts: FormattedTeacherDiscounts = { monthly4: 0, monthly8: 0, monthly12: 0 };
    if (updatedFetchedRow.discounts_json) {
        try {
            returnedParsedDiscounts = JSON.parse(updatedFetchedRow.discounts_json);
            if (typeof returnedParsedDiscounts !== 'object' || returnedParsedDiscounts === null) { returnedParsedDiscounts = { monthly4: 0, monthly8: 0, monthly12: 0 }; }
        } catch (e) { console.error(`[Backend API /me PATCH] Error parsing returned discounts:`, e); }
    }

    const formattedUpdatedTeacher = {
      id: updatedFetchedRow.id,
      name: `${updatedFetchedRow.first_name || ''} ${updatedFetchedRow.last_name || ''}`.trim(),
      email: updatedFetchedRow.email,
      languages: updatedFetchedRow.language ? updatedFetchedRow.language.split(',').map((lang: string) => lang.trim()) : [],
      hourlyRate: parseFloat(updatedFetchedRow.hourly_rate || 0),
      rating: parseFloat(updatedFetchedRow.rating || 0),
      bio: updatedFetchedRow.bio || '',
      status: updatedFetchedRow.status,
      createdAt: updatedFetchedRow.created_at,
      updatedAt: updatedFetchedRow.updated_at,
      freeDemoAvailable: updatedFetchedRow.free_demo_available === true,
      freeDemoDuration: parseInt(updatedFetchedRow.free_demo_duration || 0),
      availability: returnedParsedAvailability,
      discounts: returnedParsedDiscounts,
      trialClassAvailable: updatedFetchedRow.trial_class_available === true,
      trialClassPrice: parseFloat(updatedFetchedRow.trial_class_price || 0),
      defaultMeetingLink: updatedFetchedRow.default_meeting_link || null, // ADDED: Include the new field
    };

    console.log(`Teacher API (PATCH /api/teachers/me): Successfully updated profile for teacher ID: ${teacherId}.`);
    console.log(`Teacher API (PATCH /api/teachers/me): Saved freeDemoAvailable: ${formattedUpdatedTeacher.freeDemoAvailable}, freeDemoDuration: ${formattedUpdatedTeacher.freeDemoDuration}, defaultMeetingLink: ${formattedUpdatedTeacher.defaultMeetingLink}`); // ADDED: Log new field
    console.log(`Teacher API (PATCH /api/teachers/me): Saved Availability (for frontend): ${JSON.stringify(formattedUpdatedTeacher.availability)}`);
    console.log(`Teacher API (PATCH /api/teachers/me): Saved Discounts (for frontend): ${JSON.stringify(formattedUpdatedTeacher.discounts)}`);
    return NextResponse.json(formattedUpdatedTeacher);

  } catch (error) {
    console.error("Teacher API (PATCH /api/teachers/me) error:", error);
    return NextResponse.json({ error: "Failed to update teacher profile", details: (error as Error).message }, { status: 500 });
  }
}
