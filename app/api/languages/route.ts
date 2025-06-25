import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Assuming your database connection is here

// Define an interface matching your Language table in the database
interface LanguageRow {
  id: string; // Or number, depending on your database schema for the ID
  name: string;
  code: string;
}

export async function GET() {
  try {
    console.log("API (GET /api/languages): Attempting to fetch language list from database.");

    // CORRECTED: Changed db.query to db.rawQuery based on your db.ts type definition
    const result = await db.rawQuery("SELECT id, name, code FROM languages ORDER BY name ASC");

    const languages: LanguageRow[] = result.rows; // `result.rows` should be array of objects

    console.log(`API (GET /api/languages): Successfully fetched ${languages.length} languages from database.`);
    return NextResponse.json(languages, { status: 200 });

  } catch (error) {
    console.error("API (GET /api/languages) error:", error);
    return new NextResponse(JSON.stringify({
      message: "Failed to fetch languages from database",
      details: (error instanceof Error) ? error.message : String(error),
      code: (error as any).code
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
