import { db } from "../lib/db"

async function cleanupDuplicateBookings() {
  try {
    console.log("Starting duplicate booking cleanup...")

    const beforeLessonsByPayment = await db.rawQuery(
      `SELECT COUNT(*)::int AS count
       FROM (
         SELECT payment_id
         FROM lessons
         WHERE payment_id IS NOT NULL AND TRIM(payment_id) != ''
         GROUP BY payment_id
         HAVING COUNT(*) > 1
       ) d`,
      [],
    )

    const beforeTransactionsByPayment = await db.rawQuery(
      `SELECT COUNT(*)::int AS count
       FROM (
         SELECT payment_id
         FROM transactions
         WHERE payment_id IS NOT NULL AND TRIM(payment_id) != ''
         GROUP BY payment_id
         HAVING COUNT(*) > 1
       ) d`,
      [],
    )

    const beforeLessonsBySlot = await db.rawQuery(
      `SELECT COUNT(*)::int AS count
       FROM (
         SELECT teacher_id, student_id, start_time, COALESCE(type, '') AS type
         FROM lessons
         GROUP BY teacher_id, student_id, start_time, COALESCE(type, '')
         HAVING COUNT(*) > 1
       ) d`,
      [],
    )

    console.log("Duplicate groups before cleanup:")
    console.log(`- Lessons by payment_id: ${beforeLessonsByPayment.rows[0]?.count || 0}`)
    console.log(`- Transactions by payment_id: ${beforeTransactionsByPayment.rows[0]?.count || 0}`)
    console.log(`- Lessons by booking slot: ${beforeLessonsBySlot.rows[0]?.count || 0}`)

    await db.rawQuery("BEGIN", [])

    // 1) Remove duplicate lessons by payment_id (keep the earliest row)
    const deletedLessonsByPayment = await db.rawQuery(
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
       RETURNING l.id`,
      [],
    )

    // 2) Remove remaining duplicate lessons by exact booking slot (for legacy rows without payment_id)
    const deletedLessonsBySlot = await db.rawQuery(
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
       RETURNING l.id`,
      [],
    )

    // 3) Remove duplicate transactions by payment_id (keep the earliest row)
    const deletedTransactions = await db.rawQuery(
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
       RETURNING t.id`,
      [],
    )

    await db.rawQuery("COMMIT", [])

    console.log("Cleanup completed successfully.")
    console.log(`- Lessons removed (payment duplicates): ${deletedLessonsByPayment.rowCount || 0}`)
    console.log(`- Lessons removed (slot duplicates): ${deletedLessonsBySlot.rowCount || 0}`)
    console.log(`- Transactions removed (payment duplicates): ${deletedTransactions.rowCount || 0}`)
  } catch (error) {
    console.error("Cleanup failed:", error)
    try {
      await db.rawQuery("ROLLBACK", [])
    } catch {
      // Ignore rollback failures
    }
    process.exit(1)
  }
}

cleanupDuplicateBookings()
  .then(() => {
    console.log("Duplicate booking cleanup script finished.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Unhandled cleanup error:", error)
    process.exit(1)
  })
