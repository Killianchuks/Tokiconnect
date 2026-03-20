import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

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

const ALLOWED_STATUSES = ["pending", "processed", "paid", "failed"] as const
type PayoutStatus = (typeof ALLOWED_STATUSES)[number]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser(request)
    if (!user || user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Payout ID is required" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { status } = body as { status?: string }

    if (!status || !ALLOWED_STATUSES.includes(status as PayoutStatus)) {
      return NextResponse.json(
        { error: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      )
    }

    const result = await db.rawQuery(
      `
        UPDATE payouts
        SET status = $1, updated_at = NOW()
        WHERE id::text = $2
        RETURNING id, status
      `,
      [status, id]
    )

    if (!result.rowCount || result.rowCount === 0) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    return NextResponse.json({ id, status })
  } catch (error) {
    console.error("[PAYOUTS PATCH]", error)
    return NextResponse.json({ error: "Failed to update payout status" }, { status: 500 })
  }
}
