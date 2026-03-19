import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const { teacherId: rawTeacherId } = await params
    const teacherId = decodeURIComponent(String(rawTeacherId || "")).trim()

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 })
    }

    // Build a schema-resilient SELECT to avoid failures on environments
    // that may not yet have all optional teacher columns.
    const columnsResult = await db.rawQuery(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users'`,
      [],
    )
    const userColumns = new Set(columnsResult.rows.map((row: any) => String(row.column_name)))
    const hasColumn = (columnName: string) => userColumns.has(columnName)

    const selectColumns: string[] = [
      `id`,
      hasColumn("name") ? `name` : `NULL as name`,
      hasColumn("first_name") ? `first_name as "firstName"` : `NULL as "firstName"`,
      hasColumn("last_name") ? `last_name as "lastName"` : `NULL as "lastName"`,
      hasColumn("email") ? `email` : `NULL as email`,
      hasColumn("languages") ? `languages` : `NULL as languages`,
      hasColumn("hourly_rate") ? `hourly_rate as "hourlyRate"` : `NULL as "hourlyRate"`,
      hasColumn("rating") ? `rating` : `NULL as rating`,
      hasColumn("availability") ? `availability` : `NULL as availability`,
      hasColumn("profile_image") ? `profile_image as "profileImage"` : `NULL as "profileImage"`,
      hasColumn("default_meeting_link")
        ? `default_meeting_link as "defaultMeetingLink"`
        : `NULL as "defaultMeetingLink"`,
      hasColumn("timezone") ? `timezone` : `NULL as timezone`,
      hasColumn("bio") ? `bio` : `NULL as bio`,
      hasColumn("status") ? `status` : `NULL as status`,
      hasColumn("specialties") ? `specialties` : `NULL as specialties`,
      hasColumn("discount_percent") ? `discount_percent as "discountPercent"` : `NULL as "discountPercent"`,
    ]

    const query = `
      SELECT ${selectColumns.join(", ")}
      FROM users
      WHERE id::text = $1::text AND role = 'teacher'
    `

    const result = await db.rawQuery(query, [teacherId])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      )
    }
    
    const row = result.rows[0]
    
    // Transform the data to match the expected format
    const teacher = {
      id: row.id,
      name: row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unknown Teacher',
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      languages: row.languages || [],
      hourlyRate: row.hourlyRate || 25,
      rating: row.rating || 4.5,
      reviews: 0, // Would need a separate reviews table
      availability: row.availability || [],
      profileImage: row.profileImage,
      image: row.profileImage || '/diverse-classroom.png',
      bio: row.bio || 'Experienced language teacher ready to help you learn.',
      status: row.status || 'active',
      specialties: row.specialties || [],
      discountPercent: row.discountPercent || 0,
      discounts: {
        monthly4: 10,
        monthly8: 15,
        monthly12: 20,
      },
      trialClassAvailable: true,
      defaultMeetingLink: row.defaultMeetingLink || "",
      timezone: row.timezone || null,
      trialClassPrice: Math.round((row.hourlyRate || 25) * 0.6),
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error("Error fetching teacher:", error)
    return NextResponse.json(
      { error: "Failed to fetch teacher" },
      { status: 500 }
    )
  }
}
