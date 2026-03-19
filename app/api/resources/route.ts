import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function ensureResourcesTable() {
  await db.rawQuery(
    `CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      resource_type TEXT NOT NULL DEFAULT 'tip',
      language TEXT NOT NULL,
      resource_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
  )
}

export async function GET(request: NextRequest) {
  try {
    await ensureResourcesTable()

    const { searchParams } = new URL(request.url)
    const language = searchParams.get("language")
    const query = searchParams.get("q")
    const teacherId = searchParams.get("teacherId")

    const conditions: string[] = []
    const params: any[] = []

    if (teacherId) {
      params.push(teacherId)
      conditions.push(`r.teacher_id = $${params.length}`)
    }

    if (language) {
      params.push(language)
      conditions.push(`LOWER(r.language) = LOWER($${params.length})`)
    }

    if (query) {
      params.push(`%${query}%`)
      conditions.push(
        `(r.title ILIKE $${params.length} OR r.description ILIKE $${params.length} OR r.language ILIKE $${params.length})`,
      )
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const result = await db.rawQuery(
      `SELECT
        r.id,
        r.teacher_id,
        r.title,
        r.description,
        r.resource_type,
        r.language,
        r.resource_url,
        r.created_at,
        COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.name, 'Teacher') AS teacher_name
      FROM resources r
      LEFT JOIN users u ON u.id::text = r.teacher_id::text
      ${whereClause}
      ORDER BY r.created_at DESC`,
      params,
    )

    return NextResponse.json({ resources: result.rows || [] })
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureResourcesTable()

    const body = await request.json()
    const { teacherId, title, description, resourceType, language, resourceUrl } = body

    if (!teacherId || !title || !language) {
      return NextResponse.json({ error: "Teacher, title, and language are required" }, { status: 400 })
    }

    const currentUser = await auth.getCurrentUser(request)

    if (currentUser) {
      if (currentUser.role !== "teacher" && currentUser.role !== "admin") {
        return NextResponse.json({ error: "Only teachers can upload resources" }, { status: 403 })
      }

      if (currentUser.role === "teacher" && String(currentUser.id) !== String(teacherId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      const teacherCheck = await db.rawQuery(
        `SELECT id FROM users WHERE id = $1 AND role = 'teacher'`,
        [teacherId],
      )

      if (teacherCheck.rows.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const id = crypto.randomUUID()
    const insertResult = await db.rawQuery(
      `INSERT INTO resources (
        id,
        teacher_id,
        title,
        description,
        resource_type,
        language,
        resource_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        id,
        teacherId,
        title,
        description || "",
        resourceType || "tip",
        language,
        resourceUrl || null,
      ],
    )

    return NextResponse.json({ resource: insertResult.rows[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating resource:", error)
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureResourcesTable()

    const body = await request.json()
    const { id, teacherId, title, description, resourceType, language, resourceUrl } = body

    if (!id || !teacherId || !title || !language) {
      return NextResponse.json({ error: "ID, teacher, title, and language are required" }, { status: 400 })
    }

    const currentUser = await auth.getCurrentUser(request)

    if (currentUser) {
      if (currentUser.role !== "teacher" && currentUser.role !== "admin") {
        return NextResponse.json({ error: "Only teachers can edit resources" }, { status: 403 })
      }

      if (currentUser.role === "teacher" && String(currentUser.id) !== String(teacherId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      const teacherCheck = await db.rawQuery(
        `SELECT id FROM users WHERE id = $1 AND role = 'teacher'`,
        [teacherId],
      )

      if (teacherCheck.rows.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const ownership = await db.rawQuery(
      `SELECT id FROM resources WHERE id = $1 AND teacher_id = $2`,
      [id, teacherId],
    )

    if (ownership.rows.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    const updateResult = await db.rawQuery(
      `UPDATE resources
      SET title = $1,
          description = $2,
          resource_type = $3,
          language = $4,
          resource_url = $5
      WHERE id = $6 AND teacher_id = $7
      RETURNING *`,
      [
        title,
        description || "",
        resourceType || "tip",
        language,
        resourceUrl || null,
        id,
        teacherId,
      ],
    )

    return NextResponse.json({ resource: updateResult.rows[0] })
  } catch (error) {
    console.error("Error updating resource:", error)
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureResourcesTable()

    const body = await request.json().catch(() => ({}))
    const { id, teacherId } = body

    if (!id || !teacherId) {
      return NextResponse.json({ error: "ID and teacherId are required" }, { status: 400 })
    }

    const currentUser = await auth.getCurrentUser(request)

    if (currentUser) {
      if (currentUser.role !== "teacher" && currentUser.role !== "admin") {
        return NextResponse.json({ error: "Only teachers can delete resources" }, { status: 403 })
      }

      if (currentUser.role === "teacher" && String(currentUser.id) !== String(teacherId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      const teacherCheck = await db.rawQuery(
        `SELECT id FROM users WHERE id = $1 AND role = 'teacher'`,
        [teacherId],
      )

      if (teacherCheck.rows.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const deleteResult = await db.rawQuery(
      `DELETE FROM resources
      WHERE id = $1 AND teacher_id = $2
      RETURNING id`,
      [id, teacherId],
    )

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting resource:", error)
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 })
  }
}
