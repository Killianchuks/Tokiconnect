// scripts/debug-conversations-query.js
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const conn = new URL(process.env.DATABASE_URL);
const pool = new Pool({
  user: conn.username,
  password: conn.password,
  host: conn.hostname,
  port: conn.port ? parseInt(conn.port) : 5432,
  database: conn.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const userId = 'c5e16266-06e3-4c8b-b26c-cc92904cbb25';
    const query = `
      SELECT
        l.id as lesson_id,
        l.status,
        l.start_time,
        l.end_time,
        l.meeting_link,
        l.type,
        l.duration_minutes,
        l.language,
        l.payment_id,
        l.created_at,
        l.updated_at,
        CASE
          WHEN l.student_id = $1 THEN l.teacher_id
          ELSE l.student_id
        END as partner_id,
        CASE
          WHEN l.student_id = $1 THEN tu.first_name
          ELSE su.first_name
        END as partner_first_name,
        CASE
          WHEN l.student_id = $1 THEN tu.last_name
          ELSE su.last_name
        END as partner_last_name,
        CASE
          WHEN l.student_id = $1 THEN tu.profile_image
          ELSE su.profile_image
        END as partner_image,
        m.content as last_message,
        m.created_at as last_message_at
      FROM lessons l
      LEFT JOIN users tu ON l.teacher_id = tu.id
      LEFT JOIN users su ON l.student_id = su.id
      LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM messages
        WHERE lesson_id = l.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      WHERE l.student_id = $1 OR l.teacher_id = $1
      ORDER BY COALESCE(m.created_at, l.start_time) DESC
    `;

    const res = await pool.query(query, [userId]);
    console.log('lessons', res.rows.length);
    console.log(res.rows.slice(0, 3));
  } catch (e) {
    console.error('query error:', e);
  } finally {
    await pool.end();
  }
})();
