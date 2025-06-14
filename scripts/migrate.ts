import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

// This script runs migrations on the database
async function main() {
  console.log("Running migrations...")

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  const db = drizzle(sql)

  try {
    await migrate(db, { migrationsFolder: "drizzle" })
    console.log("Migrations completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }

  await sql.end()
  process.exit(0)
}

main().catch((error) => {
  console.error("Unhandled error during migration:", error)
  process.exit(1)
})
