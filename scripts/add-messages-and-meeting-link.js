// scripts/add-messages-and-meeting-link.js
// This script adds the meeting_link column to the lessons table
// and creates a messages table for lesson-based messaging.

const { Pool } = require("pg")
const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") })

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log("Applying schema updates...")

    // Add meeting_link column if missing
    await pool.query(`
      ALTER TABLE lessons
      ADD COLUMN IF NOT EXISTS meeting_link TEXT;
    `)
    console.log("✅ Ensured lessons.meeting_link exists")

    // Add default_meeting_link column to users (for teacher default meeting link)
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS default_meeting_link TEXT;
    `)
    console.log("✅ Ensured users.default_meeting_link exists")

    // Add unique constraint to prevent duplicate lessons for same student/teacher/time.
    // If duplicates already exist, we skip this step to avoid failing the migration.
    try {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'unique_lesson_per_time'
          ) THEN
            ALTER TABLE lessons
            ADD CONSTRAINT unique_lesson_per_time
            UNIQUE (student_id, teacher_id, start_time);
          END IF;
        END;
        $$;
      `)
      console.log("✅ Ensured unique (student_id, teacher_id, start_time) constraint exists")
    } catch (constraintError) {
      if (constraintError.code === '23505') {
        console.warn(
          "⚠️ Duplicate lessons exist, skipping unique constraint creation (remove duplicates before re-running)."
        )
      } else {
        throw constraintError
      }
    }

    // Create messages table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log("✅ Ensured messages table exists")

    console.log("Schema updates applied successfully")
  } catch (error) {
    console.error("Error applying schema updates:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

run()
