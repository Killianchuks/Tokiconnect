const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
require("dotenv").config()

async function addTestUsers() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log("Adding test users to database...")

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10)
    const teacherPassword = await bcrypt.hash("teacher123", 10)
    const studentPassword = await bcrypt.hash("student123", 10)

    // Check if admin user exists
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = $1", ["admin@tokiconnect.com"])

    if (adminCheck.rows.length === 0) {
      // Add admin user
      await pool.query(
        "INSERT INTO users (first_name, last_name, email, password, role, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        ["Admin", "User", "admin@tokiconnect.com", adminPassword, "admin", true, new Date()],
      )
      console.log("✅ Admin user created")
    } else {
      console.log("Admin user already exists")
    }

    // Check if teacher user exists
    const teacherCheck = await pool.query("SELECT * FROM users WHERE email = $1", ["teacher@tokiconnect.com"])

    if (teacherCheck.rows.length === 0) {
      // Add teacher user
      await pool.query(
        "INSERT INTO users (first_name, last_name, email, password, role, language, hourly_rate, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        ["Teacher", "User", "teacher@tokiconnect.com", teacherPassword, "teacher", "Spanish", 25, true, new Date()],
      )
      console.log("✅ Teacher user created")
    } else {
      console.log("Teacher user already exists")
    }

    // Check if student user exists
    const studentCheck = await pool.query("SELECT * FROM users WHERE email = $1", ["student@tokiconnect.com"])

    if (studentCheck.rows.length === 0) {
      // Add student user
      await pool.query(
        "INSERT INTO users (first_name, last_name, email, password, role, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        ["Student", "User", "student@tokiconnect.com", studentPassword, "student", true, new Date()],
      )
      console.log("✅ Student user created")
    } else {
      console.log("Student user already exists")
    }

    console.log("✅ Test users added successfully!")
  } catch (error) {
    console.error("Error adding test users:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

addTestUsers()
  .then(() => {
    console.log("Test users setup complete")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Test users setup failed:", error)
    process.exit(1)
  })
