// This script checks and fixes the users table structure
const { Pool } = require("pg")

async function fixUsersTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  })

  try {
    console.log("🔍 Checking users table structure...")

    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      console.log("⚠️ Users table does not exist. Creating it...")

      // Create users table with the correct structure
      await pool.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'student',
          language TEXT,
          hourly_rate INTEGER,
          bio TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)

      console.log("✅ Users table created successfully")
      return
    }

    // Check column structure
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `)

    const columns = columnCheck.rows.map((row) => row.column_name)

    // Check if we need to add first_name and last_name
    if (!columns.includes("first_name") && !columns.includes("last_name") && columns.includes("name")) {
      console.log("🔄 Converting name column to first_name and last_name...")

      // Add the new columns
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN first_name TEXT,
        ADD COLUMN last_name TEXT
      `)

      // Update the new columns from the name column
      await pool.query(`
        UPDATE users 
        SET 
          first_name = SPLIT_PART(name, ' ', 1),
          last_name = SUBSTRING(name FROM POSITION(' ' IN name))
      `)

      // Make the new columns NOT NULL
      await pool.query(`
        ALTER TABLE users 
        ALTER COLUMN first_name SET NOT NULL,
        ALTER COLUMN last_name SET NOT NULL
      `)

      console.log("✅ Added first_name and last_name columns")
    }

    // Check if we need to add role column
    if (!columns.includes("role")) {
      console.log("➕ Adding role column...")

      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN role TEXT NOT NULL DEFAULT 'student'
      `)

      console.log("✅ Added role column")
    }

    // Check if we need to add other missing columns
    const requiredColumns = [
      { name: "language", type: "TEXT" },
      { name: "hourly_rate", type: "INTEGER" },
      { name: "bio", type: "TEXT" },
      { name: "is_active", type: "BOOLEAN", default: "TRUE" },
      { name: "created_at", type: "TIMESTAMP", default: "NOW()" },
      { name: "updated_at", type: "TIMESTAMP", default: "NOW()" },
    ]

    for (const col of requiredColumns) {
      if (!columns.includes(col.name)) {
        console.log(`➕ Adding ${col.name} column...`)

        let query = `ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`
        if (col.default) {
          query += ` DEFAULT ${col.default}`
        }

        await pool.query(query)
        console.log(`✅ Added ${col.name} column`)
      }
    }

    console.log("✅ Users table structure is now correct")
  } catch (error) {
    console.error("❌ Error fixing users table:", error)
  } finally {
    await pool.end()
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixUsersTable()
    .then(() => console.log("✅ Script completed"))
    .catch((err) => console.error("❌ Script failed:", err))
}

module.exports = { fixUsersTable }
