import { db } from "../lib/db"

async function addTimezoneColumn() {
  try {
    console.log("Adding timezone column to users table...")

    // Add the column if it doesn't exist
    await db.rawQuery(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS timezone TEXT
    `)

    console.log("Timezone column added successfully!")

    // Update existing users to have a default timezone
    await db.rawQuery(`
      UPDATE users
      SET timezone = 'America/New_York'
      WHERE timezone IS NULL AND role = 'teacher'
    `)

    console.log("Existing teacher records updated with default timezone!")

  } catch (error) {
    console.error("Error adding timezone column:", error)
    process.exit(1)
  }
}

addTimezoneColumn().then(() => {
  console.log("Migration completed!")
  process.exit(0)
})