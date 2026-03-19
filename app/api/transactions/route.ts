import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function formatDate(value: unknown): string {
  if (!value) return "-"

  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString()
}

export async function GET(request: Request) {
  try {
    const token = await auth.getAuthCookie()
    let user = token ? auth.verifyToken(token) : null

    if (!user) {
      const userId = request.headers.get("x-user-id")
      const userRole = request.headers.get("x-user-role")
      if (userId && userRole === "admin") {
        user = { id: userId, role: userRole }
      }
    }

    if (!user || user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    let query = `
      SELECT
        transactions.*,
        teacher.first_name AS teacher_first_name,
        teacher.last_name AS teacher_last_name,
        student.first_name AS student_first_name,
        student.last_name AS student_last_name
      FROM transactions
      LEFT JOIN users AS teacher ON teacher.id::text = transactions.teacher_id::text
      LEFT JOIN users AS student ON student.id::text = transactions.user_id::text
    `
    const params: string[] = []

    if (type) {
      query += " WHERE transactions.type = $1"
      params.push(type)
    }

    query += " ORDER BY transactions.created_at DESC LIMIT 200"

    const result = await db.rawQuery(query, params)

    const transactions = (result.rows || []).map((row: any) => {
      const teacherName = [row.teacher_first_name, row.teacher_last_name].filter(Boolean).join(" ")
      const studentName = [row.student_first_name, row.student_last_name].filter(Boolean).join(" ")

      return {
      id: String(row.id),
      date: formatDate(row.created_at),
      teacher: teacherName || row.teacher_id || "Unknown teacher",
      student: studentName || row.user_id || "Unknown student",
      type: row.type || "lesson",
      amount: toNumber(row.amount),
      platformFee: toNumber(row.platform_fee),
      teacherEarnings: toNumber(row.teacher_earnings),
      status: row.status || "pending",
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("[TRANSACTIONS]", error)
    return NextResponse.json([])
  }
}
