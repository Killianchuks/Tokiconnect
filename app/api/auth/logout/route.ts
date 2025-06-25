import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    console.log("API (POST /api/auth/logout): Attempting to log out user.");

    const cookieStore = await cookies();

    if (cookieStore.has('auth_token')) {
      cookieStore.delete('auth_token');
      console.log("API (POST /api/auth/logout): 'auth_token' cookie deleted.");
    } else {
      console.log("API (POST /api/auth/logout): 'auth_token' cookie not found, no action needed.");
    }

    return NextResponse.json({ message: "Successfully logged out" }, { status: 200 });

  } catch (error) {
    console.error("API (POST /api/auth/logout) error during logout:", error);
    return new NextResponse(JSON.stringify({ message: "Logout failed", details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
