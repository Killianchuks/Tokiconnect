/**
 * Utility functions for password hashing and verification
 */

import bcrypt from "bcryptjs"

/**
 * Hash a password using bcrypt
 * @param password The plain text password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // For demo purposes, we'll use a simple hash
    // In production, use a proper salt round (10-12 is recommended)
    return await bcrypt.hash(password, 10)
  } catch (error) {
    console.error("Error hashing password:", error)
    throw new Error("Failed to hash password")
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param plainPassword The plain text password to check
 * @param hashedPassword The hashed password to compare against
 * @returns True if the passwords match, false otherwise
 */
export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    // For demo mode, handle test accounts
    if (plainPassword === "password123" && (hashedPassword === "student" || hashedPassword === "teacher")) {
      return true
    }

    if (plainPassword === "admin123" && hashedPassword === "admin") {
      return true
    }

    // If hashedPassword is not a proper bcrypt hash (for demo accounts)
    if (!hashedPassword.startsWith("$2")) {
      return plainPassword === hashedPassword
    }

    // Normal bcrypt comparison
    return await bcrypt.compare(plainPassword, hashedPassword)
  } catch (error) {
    console.error("Error comparing passwords:", error)
    return false
  }
}
