import { Pool } from "pg"
import dotenv from "dotenv"

// Load environment variables from .env file
dotenv.config()

// Define a type for PostgreSQL errors
interface PostgresError extends Error {
  code?: string
}

async function testDatabaseConnection() {
  console.log("Testing database connection...")

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set")
    console.log("Please make sure you have a .env file with DATABASE_URL defined")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    // Test basic connection
    console.log("Connecting to database...")
    const result = await pool.query("SELECT NOW()")
    console.log(`✅ Database connection successful! Current time: ${result.rows[0].now}`)

    // Check if users table exists
    try {
      console.log("Checking users table...")
      const usersResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'users'
        )
      `)

      if (usersResult.rows[0].exists) {
        console.log("✅ Users table exists")

        // Count users
        const countResult = await pool.query("SELECT COUNT(*) FROM users")
        console.log(`ℹ️ Number of users in database: ${countResult.rows[0].count}`)
      } else {
        console.log("❌ Users table does not exist")
        console.log("Run the database migration script to create tables:")
        console.log("npm run migrate")
      }
    } catch (error) {
      console.error("❌ Error checking users table:", error instanceof Error ? error.message : String(error))
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error instanceof Error ? error.message : String(error))

    // Provide more specific guidance based on error code
    if (isPostgresError(error) && error.code === "ENOTFOUND") {
      console.log("The database host could not be found. Check your DATABASE_URL.")
    } else if (isPostgresError(error) && error.code === "ECONNREFUSED") {
      console.log("Connection was refused. Make sure your database server is running.")
    } else if (isPostgresError(error) && error.code === "28P01") {
      console.log("Authentication failed. Check your username and password in DATABASE_URL.")
    } else if (isPostgresError(error) && error.code === "3D000") {
      console.log("Database does not exist. Create it first or check the database name in DATABASE_URL.")
    }
  } finally {
    await pool.end()
  }
}

// Type guard to check if an error is a Postgres error with a code
function isPostgresError(error: unknown): error is PostgresError {
  return error instanceof Error && "code" in error
}

testDatabaseConnection()
  .then(() => {
    console.log("Database test complete")
  })
  .catch((error) => {
    console.error("Unexpected error:", error instanceof Error ? error.message : String(error))
  })
