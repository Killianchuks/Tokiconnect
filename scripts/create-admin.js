const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
require("dotenv").config()

async function createAdminUser() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log("Creating admin user...")

    // Hash the password
    const password = "admin123"
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if admin already exists
    const existingAdmin = await pool.query("SELECT * FROM users WHERE email = $1", ["admin@tokiconnect.com"])

    if (existingAdmin.rows && existingAdmin.rows.length > 0) {
      console.log("Admin user already exists. Updating password...")
      await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, "admin@tokiconnect.com"])
    } else {
      // Create admin user
      await pool.query(
        `INSERT INTO users (
          first_name, 
          last_name, 
          email, 
          password, 
          role
        ) VALUES ($1, $2, $3, $4, $5)`,
        ["Admin", "User", "admin@tokiconnect.com", hashedPassword, "admin"],
      )
    }

    console.log("✅ Admin user created/updated successfully!")
    console.log("Email: admin@tokiconnect.com")
    console.log("Password: admin123")
  } catch (error) {
    console.error("Error creating admin user:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

createAdminUser()
  .then(() => {
    console.log("Admin user setup complete")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Admin user setup failed:", error)
    process.exit(1)
  })
