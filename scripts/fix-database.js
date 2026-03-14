// scripts/fix-database.js
const { Pool } = require("pg")
require("dotenv").config()

async function fixDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  })

  try {
    console.log("🔍 Checking database tables...")

    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `)

    if (!tableCheck.rows[0].exists) {
      console.log("⚠️ Users table does not exist, creating it...")

      // Create users table with the structure from create-tables.js
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
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)

      console.log("✅ Users table created successfully")
    } else {
      console.log("✅ Users table exists, checking structure...")

      // Get current table structure
      const columnsInfo = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
      `)

      const columnNames = columnsInfo.rows.map((row) => row.column_name)
      console.log("📊 Current columns:", columnNames)

      // Check if we need to migrate from name to first_name/last_name
      if (columnNames.includes("name") && !columnNames.includes("first_name")) {
        console.log("🔄 Migrating from name to first_name/last_name...")

        // Add first_name and last_name columns
        await pool.query(`ALTER TABLE users ADD COLUMN first_name TEXT`)
        await pool.query(`ALTER TABLE users ADD COLUMN last_name TEXT`)

        // Split name into first_name and last_name
        await pool.query(`
          UPDATE users 
          SET 
            first_name = SPLIT_PART(name, ' ', 1),
            last_name = SUBSTRING(name FROM POSITION(' ' IN name))
        `)

        // Make first_name and last_name NOT NULL
        await pool.query(`ALTER TABLE users ALTER COLUMN first_name SET NOT NULL`)
        await pool.query(`ALTER TABLE users ALTER COLUMN last_name SET NOT NULL`)

        console.log("✅ Migration completed")
      }

      // Check if we need to migrate from first_name/last_name to name
      if (columnNames.includes("first_name") && !columnNames.includes("name")) {
        console.log("🔄 Migrating from first_name/last_name to name...")

        // Add name column
        await pool.query(`ALTER TABLE users ADD COLUMN name TEXT`)

        // Combine first_name and last_name into name
        await pool.query(`
          UPDATE users 
          SET name = CONCAT(first_name, ' ', last_name)
        `)

        // Make name NOT NULL
        await pool.query(`ALTER TABLE users ALTER COLUMN name SET NOT NULL`)

        console.log("✅ Migration completed")
      }
    }

    // Check if the table has any records
    const result = await pool.query("SELECT COUNT(*) FROM users")
    console.log(`📊 Users table has ${result.rows[0].count} records`)

    console.log("✅ Database fix completed successfully!")
  } catch (error) {
    console.error("❌ Error fixing database:", error)
  } finally {
    await pool.end()
  }
}

fixDatabase().catch(console.error)
