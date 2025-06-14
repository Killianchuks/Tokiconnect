// scripts/create-tables.js
const { Pool } = require("pg")
require("dotenv").config()

async function createTables() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log("Creating database tables...")

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
      )
    `)
    console.log("✅ Users table created or already exists")

    // Create lessons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID NOT NULL REFERENCES users(id),
        student_id UUID NOT NULL REFERENCES users(id),
        scheduled_at TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        language TEXT NOT NULL,
        price INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log("✅ Lessons table created or already exists")

    // Create reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id),
        teacher_id UUID NOT NULL REFERENCES users(id),
        student_id UUID NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log("✅ Reviews table created or already exists")

    // Create languages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS languages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log("✅ Languages table created or already exists")

    // Create support tickets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log("✅ Support tickets table created or already exists")

    console.log("✅ All tables created successfully!")
  } catch (error) {
    console.error("Error creating tables:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

createTables()
  .then(() => {
    console.log("Database setup complete")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Database setup failed:", error)
    process.exit(1)
  })
