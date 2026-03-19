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

async function ensurePayoutsTable() {
  const existsResult = await db.rawQuery("SELECT to_regclass('public.payouts') AS table_name", [])
  const tableExists = Boolean(existsResult.rows?.[0]?.table_name)

  try {
    if (!tableExists) {
      await db.rawQuery(
        `
          CREATE TABLE IF NOT EXISTS payouts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            transaction_id TEXT,
            teacher_id TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            method VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
            status VARCHAR(50) NOT NULL DEFAULT 'processed',
            processed_by TEXT,
            processed_at TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `,
        [],
      )
    }

    // Keep legacy environments compatible by adding any missing columns.
    await db.rawQuery("ALTER TABLE payouts ADD COLUMN IF NOT EXISTS transaction_id TEXT", [])
    await db.rawQuery("ALTER TABLE payouts ADD COLUMN IF NOT EXISTS teacher_id TEXT", [])
    await db.rawQuery("ALTER TABLE payouts ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2)", [])
    await db.rawQuery("ALTER TABLE payouts ADD COLUMN IF NOT EXISTS method VARCHAR(50) DEFAULT 'Bank Transfer'", [])
    await db.rawQuery("ALTER TABLE payouts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'processed'", [])
    await db.rawQuery("ALTER TABLE payouts ADD COLUMN IF NOT EXISTS processed_by TEXT", [])
    await db.rawQuery("ALTER TABLE payouts ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP DEFAULT NOW()", [])
    await db.rawQuery("ALTER TABLE payouts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()", [])
    await db.rawQuery("ALTER TABLE payouts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()", [])

    // Backfill a unique value for old rows that predate transaction linkage.
    await db.rawQuery(
      `
        UPDATE payouts
        SET transaction_id = CONCAT('legacy-', id::text)
        WHERE transaction_id IS NULL OR transaction_id = ''
      `,
      [],
    )

    await db.rawQuery("CREATE INDEX IF NOT EXISTS idx_payouts_teacher_id ON payouts(teacher_id)", [])
    await db.rawQuery("CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status)", [])
    await db.rawQuery("CREATE INDEX IF NOT EXISTS idx_payouts_processed_at ON payouts(processed_at)", [])
  } catch (error) {
    throw new Error(
      `Payouts table is missing or outdated and could not be auto-migrated. Run scripts/create-payouts-table.sql. ${error instanceof Error ? error.message : ""}`,
    )
  }
}

async function getAdminUser(request: Request) {
  const token = await auth.getAuthCookie()
  let user: any = token ? auth.verifyToken(token) : null

  if (!user) {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")
    if (userId && userRole === "admin") {
      user = { id: userId, role: userRole }
    }
  }

  return user
}

async function listPayouts() {
  await ensurePayoutsTable()

  const result = await db.rawQuery(
    `
      SELECT
        payouts.id,
        payouts.amount,
        payouts.method,
        payouts.status,
        payouts.processed_at,
        payouts.created_at,
        teacher.first_name AS teacher_first_name,
        teacher.last_name AS teacher_last_name
      FROM payouts
      LEFT JOIN users AS teacher ON teacher.id::text = payouts.teacher_id::text
      ORDER BY COALESCE(payouts.processed_at, payouts.created_at) DESC
      LIMIT 200
    `,
    [],
  )

  return (result.rows || []).map((row: any) => {
    const teacherName = [row.teacher_first_name, row.teacher_last_name].filter(Boolean).join(" ")

    return {
      id: String(row.id),
      date: formatDate(row.processed_at || row.created_at),
      teacher: teacherName || "Unknown teacher",
      amount: toNumber(row.amount),
      method: row.method || "Bank Transfer",
      status: row.status || "processed",
    }
  })
}

async function processNewPayouts(adminId: string) {
  await ensurePayoutsTable()

  const insertResult = await db.rawQuery(
    `
      INSERT INTO payouts (transaction_id, teacher_id, amount, method, status, processed_by, processed_at)
      SELECT
        transactions.id::text,
        transactions.teacher_id::text,
        COALESCE(transactions.teacher_earnings, 0),
        'Bank Transfer',
        'processed',
        $1,
        NOW()
      FROM transactions
      WHERE transactions.status = 'completed'
        AND COALESCE(transactions.teacher_earnings, 0) > 0
        AND NOT EXISTS (
          SELECT 1
          FROM payouts
          WHERE payouts.transaction_id = transactions.id::text
        )
      RETURNING id
    `,
    [adminId],
  )

  return insertResult.rowCount || 0
}

export async function GET(request: Request) {
  try {
    const user = await getAdminUser(request)

    if (!user || user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const payouts = await listPayouts()
    return NextResponse.json(payouts)
  } catch (error) {
    console.error("[PAYOUTS]", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAdminUser(request)

    if (!user || user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const processedCount = await processNewPayouts(String(user.id))
    const payouts = await listPayouts()

    return NextResponse.json({
      success: true,
      processedCount,
      payouts,
    })
  } catch (error) {
    console.error("[PAYOUTS_PROCESS]", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to process payouts" },
      { status: 500 },
    )
  }
}
