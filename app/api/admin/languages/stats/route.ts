import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Get teacher counts by language
    const teachersByLanguageResult = await db.rawQuery(`
      WITH teacher_languages AS (
        SELECT u.id AS teacher_id, LOWER(TRIM(u.language)) AS language
        FROM users u
        WHERE u.role = 'teacher' AND u.language IS NOT NULL AND TRIM(u.language) != ''

        UNION

        SELECT u.id AS teacher_id, LOWER(TRIM(lang)) AS language
        FROM users u
        CROSS JOIN LATERAL UNNEST(COALESCE(u.languages, ARRAY[]::text[])) AS lang
        WHERE u.role = 'teacher' AND lang IS NOT NULL AND TRIM(lang) != ''
      )
      SELECT language, COUNT(DISTINCT teacher_id) AS count
      FROM teacher_languages
      GROUP BY language
    `, [])
    
    const teachersByLanguage: Record<string, number> = {}
    for (const row of teachersByLanguageResult.rows) {
      teachersByLanguage[row.language] = parseInt(row.count)
    }
    
    // Get total number of students
    const studentsResult = await db.rawQuery(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'",
      []
    )
    const totalStudents = parseInt(studentsResult.rows[0]?.count || 0)
    
    // Get total teachers
    const teachersResult = await db.rawQuery(
      "SELECT COUNT(*) as count FROM users WHERE role = 'teacher'",
      []
    )
    const totalTeachers = parseInt(teachersResult.rows[0]?.count || 0)
    
    // Get lessons by language (through teachers)
    const lessonsByLanguageResult = await db.rawQuery(`
      SELECT LOWER(TRIM(l.language)) AS language, COUNT(l.id) as count
      FROM lessons l
      WHERE l.language IS NOT NULL AND TRIM(l.language) != ''
      GROUP BY LOWER(TRIM(l.language))
    `, [])
    
    const lessonsByLanguage: Record<string, number> = {}
    for (const row of lessonsByLanguageResult.rows) {
      lessonsByLanguage[row.language] = parseInt(row.count)
    }
    
    // Find the fastest growing language (most new teachers in last 30 days)
    const fastestGrowingResult = await db.rawQuery(`
      WITH recent_teacher_languages AS (
        SELECT u.id AS teacher_id, LOWER(TRIM(u.language)) AS language
        FROM users u
        WHERE u.role = 'teacher'
          AND u.created_at > NOW() - INTERVAL '30 days'
          AND u.language IS NOT NULL
          AND TRIM(u.language) != ''

        UNION

        SELECT u.id AS teacher_id, LOWER(TRIM(lang)) AS language
        FROM users u
        CROSS JOIN LATERAL UNNEST(COALESCE(u.languages, ARRAY[]::text[])) AS lang
        WHERE u.role = 'teacher'
          AND u.created_at > NOW() - INTERVAL '30 days'
          AND lang IS NOT NULL
          AND TRIM(lang) != ''
      )
      SELECT language, COUNT(DISTINCT teacher_id) AS count
      FROM recent_teacher_languages
      GROUP BY language
      ORDER BY count DESC
      LIMIT 1
    `, [])
    
    const fastestGrowing = fastestGrowingResult.rows[0]?.language || "N/A"
    
    // Get students by their interested languages (if stored)
    // For now, we'll distribute students proportionally to teachers
    const studentsByLanguage: Record<string, number> = {}
    for (const lang of Object.keys(teachersByLanguage)) {
      // Proportional distribution based on teacher availability
      const proportion = teachersByLanguage[lang] / (totalTeachers || 1)
      studentsByLanguage[lang] = Math.floor(totalStudents * proportion)
    }
    
    return NextResponse.json({
      teachersByLanguage,
      studentsByLanguage,
      lessonsByLanguage,
      fastestGrowing,
      totalTeachers,
      totalStudents,
    })
  } catch (error) {
    console.error("Error fetching language stats:", error)
    
    // Return empty stats on error
    return NextResponse.json({
      teachersByLanguage: {},
      studentsByLanguage: {},
      lessonsByLanguage: {},
      fastestGrowing: "N/A",
      totalTeachers: 0,
      totalStudents: 0,
    })
  }
}
