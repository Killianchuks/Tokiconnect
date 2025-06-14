import type { Config } from "drizzle-kit"

/**
 * Parse a PostgreSQL connection string into its components
 * @param connectionString The PostgreSQL connection string
 * @returns Object with host, port, user, password, and database
 */
function parseConnectionString(connectionString: string) {
  // Default values
  const defaults = {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "",
    database: "postgres",
  }

  // Return defaults if connection string is empty
  if (!connectionString) {
    return defaults
  }

  try {
    // Parse the connection string
    // Format: postgres://user:password@host:port/database
    const url = new URL(connectionString)

    return {
      host: url.hostname || defaults.host,
      port: url.port ? Number.parseInt(url.port, 10) : defaults.port,
      user: url.username || defaults.user,
      password: url.password || defaults.password,
      database: url.pathname.substring(1) || defaults.database,
    }
  } catch (error) {
    console.warn("Failed to parse database connection string:", error)
    return defaults
  }
}

// Parse the connection string to get individual components
const dbUrl = process.env.DATABASE_URL || ""
const { host, port, user, password, database } = parseConnectionString(dbUrl)

const config: Config = {
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host,
    port,
    user,
    password,
    database,
    // Add SSL configuration if needed
    ssl: process.env.NODE_ENV === "production" ? "require" : false,
  },
  verbose: true,
  strict: false,
}

export default config
