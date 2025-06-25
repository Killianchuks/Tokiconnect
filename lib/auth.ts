import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { serialize } from "cookie" // This import might not be strictly needed if using NextResponse.cookies.set directly
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db" // Assuming you have a database connection utility

// Define the JWT Secret from environment variables
// IMPORTANT: Ensure JWT_SECRET is set in your .env.local file (e.g., JWT_SECRET="your_very_strong_secret_key_here_at_least_32_chars")
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

// Token expiration time
const TOKEN_EXPIRATION = "7d" // 7 days

// User interface for JWT payload
// This interface defines the data that will be stored within the JWT.
export interface User extends JWTPayload {
  id: string
  email: string
  role: "admin" | "teacher" | "student" // Explicit roles
  first_name?: string // Include first_name as it's often part of user profile
  last_name?: string  // Include last_name as it's often part of user profile
  // Add any other non-sensitive user fields you want to store in the token payload here
  // e.g., language (for students), bio (for teachers), etc., if needed for quick client-side access
  // without another API call. Be mindful of token size.
}

/**
 * Creates a JSON Web Token (JWT) for the given user payload.
 * Uses the 'jose' library for robust and secure token generation.
 * @param user The user object containing id, email, role, and other relevant data for the token payload.
 * @returns A promise that resolves to the signed JWT string.
 * @throws Error if JWT_SECRET is not defined.
 */
export async function createToken(user: User): Promise<string> {
  if (!JWT_SECRET || JWT_SECRET.length === 0) {
    throw new Error("JWT_SECRET is not defined or is empty in the environment variables.")
  }
  // SignJWT creates a new JOSE JSON Web Token Signer
  return new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name, // Include these in the token payload
      last_name: user.last_name,   // Include these in the token payload
      // Add any other user properties you want stored in the token here
    })
    .setProtectedHeader({ alg: "HS256" }) // Set the algorithm for signing
    .setIssuedAt() // Set the issued at time (iat)
    .setExpirationTime(TOKEN_EXPIRATION) // Set the expiration time (exp)
    .sign(JWT_SECRET) // Sign the token with the secret key
}

/**
 * Verifies a JSON Web Token (JWT).
 * Uses the 'jose' library for secure token verification, compatible with Edge Runtime.
 * @param token The JWT string to verify.
 * @returns A promise that resolves to the decoded user payload (User interface) if valid, or null if verification fails.
 */
export async function verifyToken(token: string): Promise<User | null> {
  if (!JWT_SECRET || JWT_SECRET.length === 0) {
    console.error("JWT_SECRET is not defined for token verification. Please set it in your .env.local file.")
    return null
  }
  try {
    // jwtVerify verifies the token and returns its payload
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"], // Specify the expected signing algorithm
    })
    // Cast the generic JWTPayload to our specific User interface
    return payload as User
  } catch (error) {
    console.error("Auth (verifyToken): Token verification failed:", (error as Error).message)
    // Log specific error types for better debugging
    if ((error as any).code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.error("Auth (verifyToken): Invalid token signature.");
    } else if ((error as any).code === 'ERR_JWT_EXPIRED') {
      console.error("Auth (verifyToken): Token expired.");
    }
    return null
  }
}

// Utility object for authentication-related operations
export const auth = {
  /**
   * Retrieves the current authenticated user from the request's cookies.
   * This is primarily used in API routes and middleware.
   * @param request The NextRequest object.
   * @returns A promise that resolves to the User object if authenticated, or null otherwise.
   */
  getCurrentUser: async (request: NextRequest): Promise<User | null> => {
    const token = request.cookies.get("auth_token")?.value
    console.log(`Auth (getCurrentUser): Token received in cookies (exists: ${!!token})`);

    if (!token) {
      return null // No token found in cookies
    }

    const user = await verifyToken(token) // Verify the token
    return user // Returns null if verification fails
  },

  /**
   * Sets the authentication token as a secure, HTTP-only cookie in the response.
   * @param response The NextResponse object to modify.
   * @param token The JWT string to set.
   */
  setAuthCookie: (response: NextResponse, token: string) => {
    response.cookies.set("auth_token", token, {
      httpOnly: true, // IMPORTANT: Makes cookie inaccessible to client-side JavaScript for security
      secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
      sameSite: "lax", // 'lax' is a good balance for CSRF protection and UX, 'strict' is more secure but can cause issues with external navigations
      maxAge: 60 * 60 * 24 * 7, // 7 days (matches token expiration for session longevity)
      path: "/", // Cookie is valid across the entire application
    })
  },

  /**
   * Clears the authentication cookie from the response, effectively logging the user out.
   * @param response The NextResponse object to modify.
   */
  clearAuthCookie: (response: NextResponse) => {
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0), // Set expiration to a past date to force immediate deletion
      path: "/",
    })
  },
}
