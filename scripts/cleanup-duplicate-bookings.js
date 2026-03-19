const { Pool } = require("pg")
const dotenv = require("dotenv")

dotenv.config({ path: ".env.local" })
dotenv.config()

async function cleanupDuplicateBookings() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  })

  const client = await pool.connect()

  try {
    console.log("Starting duplicate booking cleanup...")

    const beforeLessonsByPayment = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM (
         SELECT payment_id
         FROM lessons
         WHERE payment_id IS NOT NULL AND TRIM(payment_id) != ''
         GROUP BY payment_id
         HAVING COUNT(*) > 1
       ) d`
    )

    const beforeTransactionsByPayment = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM (
         SELECT payment_id
         FROM transactions
         WHERE payment_id IS NOT NULL AND TRIM(payment_id) != ''
         GROUP BY payment_id
         HAVING COUNT(*) > 1
       ) d`
    )

    const beforeLessonsBySlot = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM (
         SELECT teacher_id, student_id, start_time, COALESCE(type, '') AS type
         FROM lessons
         GROUP BY teacher_id, student_id, start_time, COALESCE(type, '')
         HAVING COUNT(*) > 1
       ) d`
    )

    console.log("Duplicate groups before cleanup:")
    console.log(`- Lessons by payment_id: ${beforeLessonsByPayment.rows[0]?.count || 0}`)
    console.log(`- Transactions by payment_id: ${beforeTransactionsByPayment.rows[0]?.count || 0}`)
    console.log(`- Lessons by booking slot: ${beforeLessonsBySlot.rows[0]?.count || 0}`)

    await client.query("BEGIN")

    const deletedLessonsByPayment = await client.query(
      `WITH ranked AS (
         SELECT
           ctid,
           ROW_NUMBER() OVER (
             PARTITION BY payment_id
             ORDER BY COALESCE(created_at, start_time) ASC, id ASC
           ) AS rn
         FROM lessons
         WHERE payment_id IS NOT NULL AND TRIM(payment_id) != ''
       )
       DELETE FROM lessons l
       USING ranked r
       WHERE l.ctid = r.ctid AND r.rn > 1
       RETURNING l.id`
    )

    const deletedLessonsBySlot = await client.query(
      `WITH ranked AS (
         SELECT
           ctid,
           ROW_NUMBER() OVER (
             PARTITION BY teacher_id, student_id, start_time, COALESCE(type, '')
             ORDER BY COALESCE(created_at, start_time) ASC, id ASC
           ) AS rn
         FROM lessons
       )
       DELETE FROM lessons l
       USING ranked r
       WHERE l.ctid = r.ctid AND r.rn > 1
       RETURNING l.id`
    )

    const deletedTransactions = await client.query(
      `WITH ranked AS (
         SELECT
           ctid,
           ROW_NUMBER() OVER (
             PARTITION BY payment_id
             ORDER BY COALESCE(created_at, NOW()) ASC, id ASC
           ) AS rn
         FROM transactions
         WHERE payment_id IS NOT NULL AND TRIM(payment_id) != ''
       )
       DELETE FROM transactions t
       USING ranked r
       WHERE t.ctid = r.ctid AND r.rn > 1
       RETURNING t.id`
    )

    await client.query("COMMIT")

    console.log("Cleanup completed successfully.")
    console.log(`- Lessons removed (payment duplicates): ${deletedLessonsByPayment.rowCount || 0}`)
    console.log(`- Lessons removed (slot duplicates): ${deletedLessonsBySlot.rowCount || 0}`)
    console.log(`- Transactions removed (payment duplicates): ${deletedTransactions.rowCount || 0}`)
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

cleanupDuplicateBookings()
  .then(() => {
    console.log("Duplicate booking cleanup script finished.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Cleanup failed:", error)
    process.exit(1)
  })
