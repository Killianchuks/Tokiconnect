import { Pool } from "pg"

// Set DB_DEBUG=false to silence database request logging in development
const shouldLogDb = process.env.NODE_ENV !== "production" && process.env.DB_DEBUG !== "false"

// Ensure we only print the init log once per process (Next.js can reload modules frequently in dev)
let hasLoggedPoolInitialization = false

// Create a connection pool
let pool: Pool | null = null

// Initialize the database connection
const initializePool = async () => {
  if (pool) return pool

  try {
    if (shouldLogDb && !hasLoggedPoolInitialization) {
      console.log("🔄 Initializing database connection pool")
      hasLoggedPoolInitialization = true
    }

    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is not set")
      throw new Error("DATABASE_URL is not defined")
    }

    // Ensure the connection string has sslmode=verify-full for future compatibility
    let connectionString = process.env.DATABASE_URL
    if (connectionString.includes('sslmode=require') || connectionString.includes('sslmode=prefer') || connectionString.includes('sslmode=verify-ca')) {
      connectionString = connectionString.replace(/sslmode=(require|prefer|verify-ca)/, 'sslmode=verify-full')
    } else if (!connectionString.includes('sslmode=')) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=verify-full'
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })

    // Test the connection
    const client = await pool.connect()
    try {
      const result = await client.query("SELECT NOW()")
      if (shouldLogDb) console.log("✅ Database connected successfully:", result.rows[0].now)
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
    try {
      if (!pool) {
        await initializePool()
      }

      if (!pool) {
        throw new Error("Database connection not available")
      }

      const start = Date.now()
      const result = await pool.query(text, params)
      const duration = Date.now() - start

      if (shouldLogDb) {
        console.log({
          query: text,
          params,
          duration: `${duration}ms`,
          rows: result.rowCount,
        })
      }

      return result
    } catch (error) {
      console.error("❌ Database query error:", error)
      throw error
    }
  },

  // Other database methods
  teachers: {
    findMany: async ({ where = {}, with: relations = {} } = {}) => {
      try {
        if (!pool) {
          await initializePool()
        }

        // Add null check after initialization attempt
        if (!pool) {
          throw new Error("Database connection not available")
        }

        const result = await pool.query("SELECT * FROM teachers WHERE active = true")
        return result.rows
      } catch (error) {
        console.error("❌ Database query error when fetching teachers:", error)
        throw error
      }
    },
  },

  // Test database connection
  testConnection: async () => {
    try {
      await initializePool()

      // Test a simple query to check if users table exists and has data
      if (pool) {
        const userCheck = await pool.query("SELECT COUNT(*) FROM users")
        const userCount = Number.parseInt(userCheck.rows[0].count, 10)

        return {
          success: true,
          message: "Database connection successful",
          details: {
            userCount,
            connectionInfo: pool.options,
          },
        }
      }

      return { success: true, message: "Database connection successful" }
    } catch (error) {
      return {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

// Also export as default
export default db
