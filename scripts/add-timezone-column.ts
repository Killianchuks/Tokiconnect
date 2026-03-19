import { db } from "../lib/db"

async function addTimezoneColumn() {
  try {
    console.log("Adding student_timezone column to lessons table...")

    // Add the column if it doesn't exist
    await db.rawQuery(`
      ALTER TABLE lessons
      ADD COLUMN IF NOT EXISTS student_timezone TEXT
    `)

    console.log("Column added successfully!")

    // Update existing lessons to have a default timezone
    await db.rawQuery(`
      UPDATE lessons
      SET student_timezone = 'America/New_York'
      WHERE student_timezone IS NULL
    `)

    console.log("Existing lessons updated with default timezone!")

  } catch (error) {
    console.error("Error adding timezone column:", error)
    process.exit(1)
  }
}

addTimezoneColumn().then(() => {
  console.log("Migration completed!")
  process.exit(0)
})