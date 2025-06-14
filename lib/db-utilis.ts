/**
 * Parse a PostgreSQL connection string into its components
 * @param connectionString The PostgreSQL connection string
 * @returns Object with host, port, user, password, and database
 */
export function parseConnectionString(connectionString: string) {
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
  