import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isPublicPageRoute } from "@/lib/auth-route-config"

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Check if the route is public
    const isPublicRoute = isPublicPageRoute(pathname)

    // For API routes, we'll check for authentication headers
    if (pathname.startsWith("/api")) {
      // Skip authentication for public API endpoints
      if (pathname.startsWith("/api/auth") || pathname === "/api/webhooks/stripe") {
        return NextResponse.next()
      }

      // For other API routes, we'll let them through for now
      return NextResponse.next()
    }

    // For all routes, we'll let them through for now
    if (isPublicRoute) {
      return NextResponse.next()
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to proceed to the error page
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
