import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Define the Teacher interface
interface Teacher {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  languages: string[]
  hourlyRate: number
  rating: number
  availability: {
    day: string
    startTime?: string
    slots?: string[]
  }[]
  profileImage?: string
  image?: string
  bio?: string
  status: "active" | "pending" | "inactive"
  specialties?: string[]
  discountPercent?: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get("language")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const search = searchParams.get("search")

    // Fetch teachers from the database (users with role = 'teacher')
    let query = `
      SELECT 
        id,
        name,
        first_name as "firstName",
        last_name as "lastName",
        email,
        language,
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
      WHERE role = 'teacher'
    `
    
    const params: any[] = []
    let paramIndex = 1
    
    // Add search filter for name
    if (search) {
      query += ` AND (LOWER(name) LIKE $${paramIndex}::text OR LOWER(first_name) LIKE $${paramIndex}::text OR LOWER(last_name) LIKE $${paramIndex}::text OR LOWER(email) LIKE $${paramIndex}::text)`
      params.push(`%${search.toLowerCase()}%`)
      paramIndex++
    }
    
    // Add filters for language (check both primary language and languages array)
    if (language) {
      // Check if language column matches (case-insensitive) or if language is in languages array
      query += ` AND (LOWER(language) = $${paramIndex}::text OR LOWER(language) LIKE $${paramIndex + 1}::text OR EXISTS (SELECT 1 FROM unnest(languages) AS lang WHERE LOWER(lang) = $${paramIndex}::text))`
      params.push(language.toLowerCase())
      params.push(`%${language.toLowerCase()}%`)
      paramIndex += 2
    }
    
    if (minPrice) {
      query += ` AND hourly_rate >= $${paramIndex}::numeric`
      params.push(Number(minPrice))
      paramIndex++
    }
    
    if (maxPrice) {
      query += ` AND hourly_rate <= $${paramIndex}::numeric`
      params.push(Number(maxPrice))
      paramIndex++
    }
    
    query += ` ORDER BY rating DESC NULLS LAST`

    const result = await db.rawQuery(query, params)
    
    // Transform the data to match the expected format
    const teachers: Teacher[] = result.rows.map((row: any) => {
      // Get languages array - include the primary language if it exists
      let languagesArray = row.languages || []
      if (row.language && !languagesArray.includes(row.language)) {
        languagesArray = [row.language, ...languagesArray]
      }
      
      return {
        id: row.id,
        name: row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unknown Teacher',
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        language: row.language, // Primary teaching language
        languages: languagesArray,
        hourlyRate: Number(row.hourlyRate) || 25,
      rating: Number(row.rating) || 4.5,
      reviewCount: 0,
      availability: row.availability || [],
      profileImage: row.profileImage,
      image: row.profileImage || '/diverse-classroom.png',
      avatar: row.profileImage || '/diverse-classroom.png',
      bio: row.bio || 'Experienced language teacher ready to help you learn.',
      status: row.status || 'active',
      specialties: row.specialties || [],
      discountPercent: Number(row.discountPercent) || 0,
      trialClassAvailable: true,
      trialClassPrice: Math.round((Number(row.hourlyRate) || 25) * 0.6),
      discounts: {
        monthly4: 10,
        monthly8: 15,
        monthly12: 20,
      },
      }
    })

    // Filter out teachers with invalid UUIDs
    const validTeachers = teachers.filter(teacher => 
      teacher.id && 
      typeof teacher.id === 'string' && 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacher.id)
    )

    return NextResponse.json(validTeachers)
  } catch (error) {
    console.error("Error in teachers API route:", error)
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 })
  }
}
