// scripts/inspect-users-table.js
const { Pool } = require("pg")
require("dotenv").config()

async function inspectUsersTable() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  })

  try {
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `)

    const usersTableExists = tableCheck.rows[0].exists

    if (!usersTableExists) {
      console.log("Users table does not exist")
      return
    }

    // Get table structure
    const columnsInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)

    console.log("Users table structure:")
    console.table(columnsInfo.rows)

    // Get constraints
    const constraints = await pool.query(`
      SELECT con.conname as constraint_name,
             con.contype as constraint_type,
             pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'users'
    `)

    console.log("\nUsers table constraints:")
    console.table(constraints.rows)

    // Get sample data (first 5 rows, with passwords redacted)
    const sampleData = await pool.query(`
      SELECT id, 
             name, 
             email, 
             'REDACTED' as password, 
             role, 
             created_at, 
             updated_at
      FROM users
      LIMIT 5
    `)

    console.log("\nSample data (up to 5 rows):")
    console.table(sampleData.rows)

    // Get row count
    const countResult = await pool.query("SELECT COUNT(*) FROM users")
    console.log(`\nTotal rows in users table: ${countResult.rows[0].count}`)
  } catch (error) {
    console.error("Error inspecting users table:", error)
  } finally {
    await pool.end()
  }
}

inspectUsersTable().catch(console.error)
