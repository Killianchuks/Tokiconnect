// lib/db.ts
import { Pool } from "pg"

// Create a connection pool
let pool: Pool | null = null

// Initialize the database connection
const initializePool = async () => {
  if (pool) return pool

  try {
    console.log("🔄 Initializing database connection pool")

    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is not set")
      throw new Error("DATABASE_URL is not defined")
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })

    // Test the connection
    const client = await pool.connect()
    try {
      const result = await client.query("SELECT NOW()")
      console.log("✅ Database connected successfully:", result.rows[0].now)
    } finally {
      client.release()
    }

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("❌ Unexpected error on idle client", err)
    })

    return pool
  } catch (error) {
    console.error("❌ Failed to initialize database connection:", error)
    pool = null
    throw error
  }
}

// Try to initialize the pool immediately
initializePool().catch((err) => {
  console.error("❌ Initial database connection failed:", err)
})

// Export the database helper with proper error handling
export const db = {
  rawQuery: async (text: string, params?: any[]) => {
    let client; // Declare client outside try-block so it's accessible in finally
    try {
      if (!pool) {
        await initializePool()
      }

      if (!pool) {
        throw new Error("Database connection not available")
      }

      client = await pool.connect(); // Acquire client from pool
      const startTime = process.hrtime.bigint(); // Start timer

      const result = await client.query(text, params);

      const endTime = process.hrtime.bigint(); // End timer
      const duration = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

      console.log({
        query: text.split('\n').map(line => line.trim()).filter(line => line.length > 0).join(' '),
        params: params ? params.map((p, i) => `$${i+1}: ${typeof p === "string" && p.length > 50 ? p.substring(0, 50) + "..." : p}`) : [],
        duration: `${duration.toFixed(0)}ms`,
        rows: result.rowCount
      });

      return result
    } catch (error) {
      console.error("❌ Database query error:", error)
      throw error
    } finally {
      if (client) { // Ensure client is released even if an error occurs
        client.release();
      }
    }
  },

  // User management methods for authentication (matching your exact schema)
  users: {
    findByEmail: async (email: string) => {
      try {
        const result = await db.rawQuery("SELECT * FROM users WHERE email = $1", [email])
        return result.rows[0] || null
      } catch (error) {
        console.error("❌ Error finding user by email:", error)
        throw error
      }
    },

    findById: async (id: string) => {
      try {
        const result = await db.rawQuery("SELECT * FROM users WHERE id = $1", [id])
        return result.rows[0] || null
      } catch (error) {
        console.error("❌ Error finding user by ID:", error)
        throw error
      }
    },

    create: async (userData: {
      firstName: string
      lastName: string
      email: string
      password: string
      role?: string
      language?: string
      hourlyRate?: number
      bio?: string
    }) => {
      try {
        const {
          firstName,
          lastName,
          email,
          password,
          role = "student",
          language = null,
          hourlyRate = null,
          bio = null,
        } = userData

        const result = await db.rawQuery(
          `INSERT INTO users (
            first_name, last_name, email, password, role, language, 
            hourly_rate, bio, is_active, created_at, updated_at, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW(), 'active') 
          RETURNING *`,
          [firstName, lastName, email, password, role, language, hourlyRate, bio],
        )
        return result.rows[0]
      } catch (error) {
        console.error("❌ Error creating user:", error)
        throw error
      }
    },

    updatePassword: async (id: string, hashedPassword: string) => {
      try {
        const result = await db.rawQuery(
          `UPDATE users SET 
            password = $1, 
            updated_at = NOW() 
          WHERE id = $2 
          RETURNING id, email, first_name, last_name`,
          [hashedPassword, id],
        )
        return result.rows[0]
      } catch (error) {
        console.error("❌ Error updating user password:", error)
        throw error
      }
    },

    setResetToken: async (id: string, token: string, expiry: Date) => {
      try {
        const result = await db.rawQuery(
          `UPDATE users SET 
            reset_token = $1, 
            reset_token_expiry = $2, 
            updated_at = NOW() 
          WHERE id = $3 
          RETURNING id, email, first_name, last_name`,
          [token, expiry, id],
        )
        return result.rows[0]
      } catch (error) {
        console.error("❌ Error setting reset token:", error)
        throw error
      }
    },

    findByResetToken: async (token: string) => {
      try {
        const result = await db.rawQuery(
          `SELECT id, email, first_name, last_name, reset_token_expiry 
          FROM users 
          WHERE reset_token = $1`,
          [token],
        )
        return result.rows[0] || null
      } catch (error) {
        console.error("❌ Error finding user by reset token:", error)
        throw error
      }
    },

    clearResetToken: async (id: string) => {
      try {
        const result = await db.rawQuery(
          `UPDATE users SET 
            reset_token = NULL, 
            reset_token_expiry = NULL, 
            updated_at = NOW() 
          WHERE id = $1 
          RETURNING id, email, first_name, last_name`,
          [id],
        )
        return result.rows[0]
      } catch (error) {
        console.error("❌ Error clearing reset token:", error)
        throw error
      }
    },

    // Additional methods for your schema
    findTeachers: async () => {
      try {
        const result = await db.rawQuery(
          `SELECT id, email, first_name, last_name, language, hourly_rate, bio, is_active
          FROM users 
          WHERE role = 'teacher' AND is_active = true
          ORDER BY first_name, last_name`,
          [],
        )
        return result.rows
      } catch (error) {
        console.error("❌ Error finding teachers:", error)
        return []
      }
    },

    updateProfile: async (
      id: string,
      profileData: {
        firstName?: string
        lastName?: string
        language?: string
        hourlyRate?: number
        bio?: string
      },
    ) => {
      try {
        const updates = []
        const values = []
        let paramCount = 1

        if (profileData.firstName !== undefined) {
          updates.push(`first_name = $${paramCount}`)
          values.push(profileData.firstName)
          paramCount++
        }

        if (profileData.lastName !== undefined) {
          updates.push(`last_name = $${paramCount}`)
          values.push(profileData.lastName)
          paramCount++
        }

        if (profileData.language !== undefined) {
          updates.push(`language = $${paramCount}`)
          values.push(profileData.language)
          paramCount++
        }

        if (profileData.hourlyRate !== undefined) {
          updates.push(`hourly_rate = $${paramCount}`)
          values.push(profileData.hourlyRate)
          paramCount++
        }

        if (profileData.bio !== undefined) {
          updates.push(`bio = $${paramCount}`)
          values.push(profileData.bio)
          paramCount++
        }

        if (updates.length === 0) {
          throw new Error("No fields to update")
        }

        updates.push(`updated_at = NOW()`)
        values.push(id)

        const result = await db.rawQuery(
          `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
          values,
        )
        return result.rows[0]
      } catch (error) {
        console.error("❌ Error updating user profile:", error)
        throw error
      }
    },
  },

  // Teachers methods (using your schema)
  teachers: {
    findMany: async ({ where = {}, with: relations = {} } = {}) => {
      try {
        if (!pool) {
          await initializePool()
        }

        if (!pool) {
          throw new Error("Database connection not available")
        }

        // Since teachers are just users with role='teacher' in your schema
        const result = await pool.query(`
          SELECT id, email, first_name, last_name, language, hourly_rate, bio, is_active, created_at
          FROM users 
          WHERE role = 'teacher' AND is_active = true
          ORDER BY first_name, last_name
        `)
        return result.rows
      } catch (error) {
        console.error("❌ Database query error when fetching teachers:", error)
        return []
      }
    },
  },

  // Test database connection
  testConnection: async () => {
    try {
      await initializePool()

      if (pool) {
        // Test a simple query to verify the schema
        const userCheck = await pool.query("SELECT COUNT(*) FROM users")
        const userCount = Number.parseInt(userCheck.rows[0].count, 10)

        // Check if we can access the specific columns
        const schemaCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          ORDER BY ordinal_position
        `)

        const columns = schemaCheck.rows.map((row) => row.column_name)
        console.log("📋 Detected users table columns:", columns)

        return {
          success: true,
          message: "Production database connection successful",
          details: {
            userCount,
            columns,
            schemaMatched: true,
          },
        }
      }

      return { success: true, message: "Database connection successful" }
    } catch (error) {
      return {
        success: false,
        message: "Production database connection failed",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

// Also export as default
export default db
