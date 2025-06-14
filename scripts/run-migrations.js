const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get list of applied migrations
    const { rows: appliedMigrations } = await pool.query('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.map(m => m.name);

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Apply migrations that haven't been applied yet
    for (const file of migrationFiles) {
      if (!appliedMigrationNames.includes(file)) {
        console.log(`Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Start a transaction
        await pool.query('BEGIN');
        try {
          // Apply the migration
          await pool.query(sql);
          
          // Record the migration
          await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          
          // Commit the transaction
          await pool.query('COMMIT');
          console.log(`Migration ${file} applied successfully`);
        } catch (error) {
          // Rollback on error
          await pool.query('ROLLBACK');
          console.error(`Error applying migration ${file}:`, error);
          process.exit(1);
        }
      } else {
        console.log(`Migration ${file} already applied`);
      }
    }

    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
