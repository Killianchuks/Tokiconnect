// scripts/create-users-table.js
const { Pool } = require("pg")
require("dotenv").config()

async function createUsersTable() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  })

  try {
    console.log("Creating users table if it does not exist...")

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log("Users table created or already exists")

    // Check if the table has any records
    const result = await pool.query("SELECT COUNT(*) FROM users")
    console.log(`Users table has ${result.rows[0].count} records`)
  } catch (error) {
    console.error("Error creating users table:", error)
  } finally {
    await pool.end()
  }
}

createUsersTable().catch(console.error)
