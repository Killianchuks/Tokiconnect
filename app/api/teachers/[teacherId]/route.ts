import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const { teacherId } = await params

    // Fetch teacher from the database
    const query = `
      SELECT 
        id,
        name,
        first_name as "firstName",
        last_name as "lastName",
        email,
        languages,
        hourly_rate as "hourlyRate",
        rating,
        availability,
        profile_image as "profileImage",
        bio,
        status,
        specialties,
        discount_percent as "discountPercent"
      FROM users 
      WHERE id = $1 AND role = 'teacher'
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
