import crypto from "crypto"
import bcrypt from "bcryptjs"

// Security configuration
const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 12,
  TOKEN_LENGTH: 32,
  TOKEN_EXPIRY_HOURS: 1,
  MAX_RESET_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
}

export class SecurityUtils {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, SECURITY_CONFIG.BCRYPT_ROUNDS)
    } catch (error) {
      console.error("❌ Error hashing password:", error)
      throw new Error("Failed to hash password")
    }
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash)
    } catch (error) {
      console.error("❌ Error verifying password:", error)
      return false
    }
  }

  /**
   * Generate a cryptographically secure reset token
   */
  static generateResetToken(): string {
    return crypto.randomBytes(SECURITY_CONFIG.TOKEN_LENGTH).toString("hex")
  }

  /**
   * Generate token expiry date
   */
  static generateTokenExpiry(): Date {
    return new Date(Date.now() + SECURITY_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
  }

  /**
   * Check if a token has expired
   */
  static isTokenExpired(expiry: Date): boolean {
    return new Date() > new Date(expiry)
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }

    if (password.length > 128) {
      errors.push("Password must be less than 128 characters long")
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push("Password must contain at least one special character")
    }

    // Check for common weak passwords
    const commonPasswords = [
      "password",
      "123456",
      "password123",
      "admin",
      "qwerty",
      "letmein",
      "welcome",
      "monkey",
      "dragon",
    ]

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push("Password is too common. Please choose a more secure password")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return emailRegex.test(email)
  }

  /**
   * Generate a secure session token
   */
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString("base64url")
  }

  /**
   * Rate limiting helper
   */
  static createRateLimiter() {
    const attempts = new Map<string, { count: number; resetTime: number }>()

    return {
      isAllowed: (identifier: string): boolean => {
        const now = Date.now()
        const record = attempts.get(identifier)

        if (!record || now > record.resetTime) {
          attempts.set(identifier, { count: 1, resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW })
          return true
        }

        if (record.count >= SECURITY_CONFIG.MAX_RESET_ATTEMPTS) {
          return false
        }

        record.count++
        return true
      },
      getRemainingTime: (identifier: string): number => {
        const record = attempts.get(identifier)
        if (!record) return 0
        return Math.max(0, record.resetTime - Date.now())
      },
    }
  }
}
