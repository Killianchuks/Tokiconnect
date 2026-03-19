import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const DEFAULT_SETTINGS = {
  standard: 12,
  premium: 10,
  newTeacher: 8,
  teacherCommission: 80,
  platformFee: 20,
}

export async function GET(request: Request) {
  try {
    const token = await auth.getAuthCookie()
    let user: any = token ? auth.verifyToken(token) : null

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

    return NextResponse.json(DEFAULT_SETTINGS)
  } catch (error) {
    console.error("[COMMISSION_SETTINGS]", error)
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

export async function PUT(request: Request) {
  try {
    const token = await auth.getAuthCookie()
    let user: any = token ? auth.verifyToken(token) : null

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

    const body = await request.json()
    // Settings would be persisted to DB in a full implementation
    return NextResponse.json({ ...DEFAULT_SETTINGS, ...body })
  } catch (error) {
    console.error("[COMMISSION_SETTINGS_PUT]", error)
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}
