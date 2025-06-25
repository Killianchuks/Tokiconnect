import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// CORRECTED IMPORT: Import 'verifyToken' directly alongside 'auth'
import { auth, verifyToken } from "@/lib/auth" // Import auth from lib/auth

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log(`Middleware: Checking path: ${pathname}`);

  // --- Admin Route Protection ---
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    console.log(`Middleware: Protecting admin path: ${pathname}`);

    // CORRECTED CALL: Use the directly imported verifyToken function
    const token = request.cookies.get("auth_token")?.value;
    let user = null;
    if (token) {
        user = await verifyToken(token);
    }
    
    console.log(`Middleware: Auth token present in cookies: ${!!token}`);

    if (!user) {
      console.log(`Middleware: No user found for protected admin path: ${pathname}. Redirecting to /admin/login.`);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Check role for admin paths
    if (user.role !== "admin") {
      console.log(`Middleware: Unauthorized access attempt to admin path ${pathname}. User role: ${user.role}. Redirecting to /admin/login.`);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    console.log(`Middleware: Verified user for admin path: ID: ${user.id}, Role: ${user.role}`);
    return NextResponse.next(); // User is admin, allow access
  }

  // --- Public Paths / Other Dashboard Paths ---
  // If no specific protection is needed, or for paths like /admin/login
  if (pathname === "/admin/login") {
    console.log(`Middleware: Allowing access to admin login page: ${pathname}`);
    return NextResponse.next();
  }

  // Add any other protected client-side dashboard paths here if needed
  // For example, if /dashboard needs login:
  // if (pathname.startsWith("/dashboard") && pathname !== "/login") {
  //   const user = await auth.getCurrentUser(request); // Use auth.getCurrentUser here as it's client-side oriented
  //   if (!user) {
  //     console.log(`Middleware: Not authenticated for dashboard path: ${pathname}. Redirecting to /login.`);
  //     return NextResponse.redirect(new URL("/login", request.url));
  //   }
  //   return NextResponse.next();
  // }

  // Allow all other requests to proceed
  return NextResponse.next()
}

// Config to specify which paths the middleware should run on
export const config = {
  matcher: [
    "/admin/:path*", // Apply middleware to all /admin routes
    // Add other paths here that need middleware checking
    // E.g., '/dashboard/:path*', '/api/:path*' (if specific API routes need checks)
  ],
}
