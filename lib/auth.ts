import { cookies } from "next/headers"
import type { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// User types
export type User = {
  id: string
  name?: string
  email: string
  role: "student" | "teacher" | "admin"
  first_name?: string
  last_name?: string
  language?: string
  hourlyRate?: number
}

// Auth helper functions
export const auth = {
  // Create a JWT token
  createToken: (user: User) => {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )
  },

  // Verify a JWT token
  verifyToken: (token: string) => {
    try {
      return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
    } catch (error) {
      return null
    }
  },

  // Set auth cookie
  setAuthCookie: (response: NextResponse, token: string) => {
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return response
  },

  // Get auth token from request (supports cookies and Authorization header)
  getAuthCookie: async (request?: Request) => {
    // If we have a request, check the Authorization header first
    if (request) {
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        return authHeader.substring(7)
      }

      // Next.js Request exposes cookies via 'cookies' property in edge runtime
      // but here we support basic Request for compatibility.
      // If it's a NextRequest, it will have cookies helper.
      // We'll try to read cookies in a safe way.
      try {
        // @ts-expect-error: cookies may not exist on Request
        const tokenFromCookie = request.cookies?.get("auth_token")?.value
        if (tokenFromCookie) return tokenFromCookie
      } catch (error) {
        // ignore
      }
    }

    // Fallback behavior (same as before)
    if (typeof window === "undefined") {
      try {
        const cookieStore = await cookies()
        return cookieStore.get("auth_token")?.value
      } catch (error) {
        console.error("Error getting auth cookie on server:", error)
        return null
      }
    }

    // For client-side
    try {
      return sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token")
    } catch (error) {
      console.error("Error getting auth cookie on client:", error)
      return null
    }
  },

  // Get current user from request
  getCurrentUser: async (request: NextRequest) => {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get("authorization")
    let token: string | null = null

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      // Try to get token from cookies
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      console.log("No token found in request")
      return null
    }

    const payload = auth.verifyToken(token)
    if (!payload) {
      console.log("Token verification failed")
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    }
  },

  // Clear auth cookie
  clearAuthCookie: (response: NextResponse) => {
    response.cookies.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    })
    return response
  },

  // Check if user is authenticated
  isAuthenticated: async (request: NextRequest) => {
    const user = await auth.getCurrentUser(request)
    return !!user
  },

  // Check if user has role
  hasRole: async (request: NextRequest, roles: string[]) => {
    const user = await auth.getCurrentUser(request)
    if (!user) return false
    return roles.includes(user.role)
  },
}

export default auth
