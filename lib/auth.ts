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

  // Get auth cookie - now async
  getAuthCookie: async () => {
    // For server-side
    if (typeof window === "undefined") {
      const cookieStore = await cookies()
      return cookieStore.get("auth_token")?.value
    }

    // For client-side
    return sessionStorage.getItem("auth_token")
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

  // Get current user from request
  getCurrentUser: async (request: NextRequest) => {
    const token = request.cookies.get("auth_token")?.value
    if (!token) return null

    const payload = auth.verifyToken(token)
    if (!payload) return null

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    }
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
