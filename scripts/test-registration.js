// scripts/test-registration.js
const { Pool } = require("pg")
require("dotenv").config()
const bcrypt = require("bcryptjs")

async function testRegistration() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log("Testing database connection...")
    const connectionTest = await pool.query("SELECT NOW()")
    console.log(`✅ Database connected successfully at ${connectionTest.rows[0].now}`)

    // Check if users table exists
    console.log("Checking if users table exists...")
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `)

    if (!tableCheck.rows[0].exists) {
      console.log("❌ Users table does not exist! Creating it now...")

      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'student',
          language TEXT,
          hourly_rate INTEGER,
          bio TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `)
      console.log("✅ Users table created successfully")
    } else {
      console.log("✅ Users table exists")
    }

    // Test user registration
    const testUser = {
      email: `test${Date.now()}@example.com`,
      firstName: "Test",
      lastName: "User",
      password: await bcrypt.hash("password123", 10),
      role: "student",
    }

    console.log(`Testing user registration with email: ${testUser.email}`)

    // Insert test user
    const insertResult = await pool.query(
      `INSERT INTO users (email, first_name, last_name, password, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, first_name, last_name, role, created_at`,
      [testUser.email, testUser.firstName, testUser.lastName, testUser.password, testUser.role],
    )

    if (insertResult.rows.length > 0) {
      console.log("✅ Test user created successfully:")
      console.log(insertResult.rows[0])
    } else {
      console.log("❌ Failed to create test user")
    }

    // Check total users
    const countResult = await pool.query("SELECT COUNT(*) FROM users")
    console.log(`Total users in database: ${countResult.rows[0].count}`)

    // List recent users
    const recentUsers = await pool.query(`
      SELECT id, email, first_name, last_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `)

    console.log("\nRecent users:")
    recentUsers.rows.forEach((user) => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - ${user.role} - Created: ${user.created_at}`)
    })
  } catch (error) {
    console.error("Error during test:", error)
  } finally {
    await pool.end()
    console.log("Test completed")
  }
}

testRegistration()
