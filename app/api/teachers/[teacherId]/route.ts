import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface DbTeacherRaw {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  language?: string;
  hourly_rate?: number;
  rating?: number;
  bio?: string;
  free_demo_available?: boolean;
  free_demo_duration?: number;
  availability?: string; // Expecting JSON string/JSONB from DB
  discounts?: string;   // Expecting JSON string/JSONB from DB
  trial_class_available?: boolean;
  trial_class_price?: number;
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


export async function GET(request: Request, context: any) {
  let teacherId: string | undefined;

  try {
    const resolvedParams = (context.params && typeof context.params.then === 'function')
                           ? await context.params
                           : context.params;

    teacherId = resolvedParams?.teacherid as string;

    console.log(`[Backend API /teachers/[id] GET] Request received for ID: "${teacherId}"`);

    if (typeof teacherId !== 'string' || teacherId.trim().length === 0) {
      console.warn(`[Backend API /teachers/[id] GET] Invalid or missing teacher ID detected: "${teacherId}". Returning 400.`);
      return NextResponse.json({ error: "Invalid teacher ID provided" }, { status: 400 });
    }

    const cleanedTeacherId = teacherId.trim();
    console.log(`[Backend API /teachers/[id] GET] Cleaned teacher ID for DB query: "${cleanedTeacherId}"`);

    const query = `
      SELECT
        id,
        first_name,
        last_name,
        email,
        role,
        status,
        language,
        hourly_rate,
        rating,
        bio
        , free_demo_available
        , free_demo_duration
        , availability         -- UNCOMMENTED
        , discounts            -- UNCOMMENTED
        , trial_class_available
        , trial_class_price
      FROM users
      WHERE id = $1 AND role = 'teacher';
    `;

    const result = await db.rawQuery(query, [cleanedTeacherId]);

    console.log(`[Backend API /teachers/[id] GET] DB Query Result (rows found): ${result.rows.length}`);
    if (result.rows.length > 0) {
        console.log(`[Backend API /teachers/[id] GET] First DB Result Row raw availability: ${result.rows[0].availability}`); // DEBUG
        console.log(`[Backend API /teachers/[id] GET] First DB Result Row raw discounts: ${result.rows[0].discounts}`);     // DEBUG
    }

    if (result.rows.length === 0) {
      console.log(`[Backend API /teachers/[id] GET] Teacher with ID "${cleanedTeacherId}" not found. Returning 404.`);
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const rawTeacher = result.rows[0] as DbTeacherRaw;

    // Parse JSON strings for availability and discounts
    let parsedAvailability: FormattedTeacherAvailability[] = [];
    if (rawTeacher.availability) {
      try {
        parsedAvailability = typeof rawTeacher.availability === 'string'
                             ? JSON.parse(rawTeacher.availability)
                             : rawTeacher.availability;
        if (!Array.isArray(parsedAvailability)) {
            console.warn(`[Backend API /teachers/[id] GET] Availability fetched for ${cleanedTeacherId} is not an array:`, parsedAvailability);
            parsedAvailability = []; // Default to empty array if malformed
        }
        console.log(`[Backend API /teachers/[id] GET] Parsed Availability: ${JSON.stringify(parsedAvailability)}`);
      } catch (e) {
        console.error(`[Backend API /teachers/[id] GET] Error parsing availability JSON for teacher ${cleanedTeacherId}:`, e);
        parsedAvailability = [];
      }
    }

    let parsedDiscounts: FormattedTeacherDiscounts = { monthly4: 0, monthly8: 0, monthly12: 0 };
    if (rawTeacher.discounts) {
        try {
            parsedDiscounts = typeof rawTeacher.discounts === 'string'
                              ? JSON.parse(rawTeacher.discounts)
                              : rawTeacher.discounts;
            if (typeof parsedDiscounts !== 'object' || parsedDiscounts === null) {
                console.warn(`[Backend API /teachers/[id] GET] Discounts fetched for ${cleanedTeacherId} is not an object:`, parsedDiscounts);
                parsedDiscounts = { monthly4: 0, monthly8: 0, monthly12: 0 }; // Default if malformed
            }
            console.log(`[Backend API /teachers/[id] GET] Parsed Discounts: ${JSON.stringify(parsedDiscounts)}`);
        } catch (e) {
            console.error(`[Backend API /teachers/[id] GET] Error parsing discounts JSON for teacher ${cleanedTeacherId}:`, e);
            parsedDiscounts = { monthly4: 0, monthly8: 0, monthly12: 0 };
        }
    }


    const teacher = {
      id: rawTeacher.id,
      name: `${rawTeacher.first_name || ''} ${rawTeacher.last_name || ''}`.trim(),
      email: rawTeacher.email,
      role: rawTeacher.role,
      status: rawTeacher.status,
      languages: rawTeacher.language ? rawTeacher.language.split(',').map(lang => lang.trim()).filter(Boolean) : [],
      hourlyRate: rawTeacher.hourly_rate || 0,
      rating: rawTeacher.rating || 0,
      bio: rawTeacher.bio || '',
      freeDemoAvailable: rawTeacher.free_demo_available === true,
      freeDemoDuration: rawTeacher.free_demo_duration || 30,
      availability: parsedAvailability,
      discounts: parsedDiscounts,
      trialClassAvailable: rawTeacher.trial_class_available === true,
      trialClassPrice: rawTeacher.trial_class_price || 0,
    };

    console.log(`[Backend API /teachers/[id] GET] Successfully fetched and processed teacher: ${teacher.name} (ID: ${teacher.id})`);
    console.log(`[Backend API /teachers/[id] GET] Formatted Teacher Availability (for frontend): ${JSON.stringify(teacher.availability)}`);
    return NextResponse.json(teacher);

  } catch (error) {
    console.error(`[Backend API /teachers/[id] GET] Critical Error fetching teacher details for ID "${teacherId || 'unknown'}":`, error);
    return NextResponse.json({ error: "Internal server error fetching teacher details" }, { status: 500 });
  }
}
