import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

function getPeriodWhereClause(period: string) {
  if (period === "previous") {
    return " AND t.created_at >= date_trunc('month', CURRENT_DATE - interval '1 month') AND t.created_at < date_trunc('month', CURRENT_DATE)"
  }

  if (period === "current") {
    return " AND t.created_at >= date_trunc('month', CURRENT_DATE)"
  }

  return ""
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")
    const period = searchParams.get("period") || "current"

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 })
    }

    const currentUser = await auth.getCurrentUser(request)

    if (currentUser && String(currentUser.id) !== String(teacherId) && currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!currentUser) {
      const teacherCheck = await db.rawQuery(
        `SELECT id FROM users WHERE id = $1 AND role = 'teacher'`,
        [teacherId],
      )

      if (teacherCheck.rows.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const periodWhere = getPeriodWhereClause(period)

    const summaryResult = await db.rawQuery(
      `SELECT
        COALESCE(SUM(CASE
          WHEN t.created_at >= date_trunc('month', CURRENT_DATE)
           AND t.status = 'completed'
          THEN t.teacher_earnings ELSE 0 END), 0) AS this_month,
        COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.teacher_earnings ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.teacher_earnings ELSE 0 END), 0) AS total
      FROM transactions t
      WHERE t.teacher_id = $1`,
      [teacherId],
    )

    const transactionsResult = await db.rawQuery(
      `SELECT
        t.id,
        t.created_at,
        t.teacher_earnings,
        t.status,
        COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.name, 'Student') AS student_name
      FROM transactions t
      LEFT JOIN users u ON u.id::text = t.user_id::text
      WHERE t.teacher_id = $1
      ${periodWhere}
      ORDER BY t.created_at DESC
      LIMIT 20`,
      [teacherId],
    )

    const summary = summaryResult.rows[0] || { this_month: 0, pending: 0, total: 0 }

    const transactions = (transactionsResult.rows || []).map((row: any) => ({
      id: row.id,
      studentName: row.student_name || "Student",
      date: new Date(row.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amount: Number(row.teacher_earnings || 0),
      status:
        row.status === "completed"
          ? "Paid"
          : row.status === "pending"
            ? "Pending"
            : "Failed",
    }))

    return NextResponse.json({
      earnings: {
        thisMonth: Number(summary.this_month || 0),
        pending: Number(summary.pending || 0),
        total: Number(summary.total || 0),
      },
      transactions,
    })
  } catch (error) {
    console.error("Error fetching teacher earnings:", error)
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 })
  }
}
