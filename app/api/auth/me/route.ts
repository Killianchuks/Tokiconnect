import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getCurrentUser(request);

    if (!user) {
      console.log("API (GET /api/auth/me): No authenticated user.");
      return new NextResponse(JSON.stringify({ message: "Not authenticated" }), { status: 401 });
    }

    const { id, email, role } = user;
    return NextResponse.json({ id, email, role }, { status: 200 });

  } catch (error) {
    console.error("API (GET /api/auth/me) error:", error);
    return new NextResponse(JSON.stringify({ message: "Authentication check failed", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
