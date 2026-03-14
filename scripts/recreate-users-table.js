// scripts/recreate-users-table.js
const { Pool } = require("pg")
require("dotenv").config()

async function recreateUsersTable() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  })

  try {
    console.log("Checking if users table exists...")

    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `)

    const usersTableExists = tableCheck.rows[0].exists

    if (usersTableExists) {
      // Backup existing data if needed
      console.log("Users table exists. Creating backup...")

      try {
        await pool.query("CREATE TABLE users_backup AS SELECT * FROM users")
        console.log("Backup created as users_backup")
      } catch (backupError) {
        console.error("Failed to create backup:", backupError)
        const proceed = await askQuestion("Continue without backup? (yes/no): ")

        if (proceed.toLowerCase() !== "yes") {
          console.log("Operation cancelled")
          return
        }
      }

      // Drop existing table
      console.log("Dropping users table...")
      await pool.query("DROP TABLE users")
    }

    // Create fresh users table
    console.log("Creating new users table...")

    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log("Users table created successfully")

    // Create test user
    console.log("Creating test user...")

    await pool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Test User', 'test@example.com', '$2a$10$eCjlzPCDmJdKBYe0XiIX3.6BwJdHxwNFXfWwkSjmjYVwYjy2AMgPe', 'student')
    `)

    console.log("Test user created with email: test@example.com and password: password123")
  } catch (error) {
    console.error("Error recreating users table:", error)
  } finally {
    await pool.end()
  }
}

// Helper function to ask questions in the terminal
function askQuestion(question) {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close()
      resolve(answer)
    })
  })
}

recreateUsersTable().catch(console.error)
