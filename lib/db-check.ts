import { db } from "./db"

export async function checkDatabaseHealth(): Promise<{
  isConnected: boolean
  tables: { name: string; count: number }[]
  error?: string
}> {
  try {
    // Test basic connection
    const connectionTest = await db.rawQuery("SELECT 1 as connected")

    if (!connectionTest || !connectionTest.rows || connectionTest.rows.length === 0) {
      return {
        isConnected: false,
        tables: [],
        error: "Database connection test failed",
      }
    }

    // Get list of tables and record counts
    const tableQuery = await db.rawQuery(`
      SELECT 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema = 'public'
    `)

    const tables = []

    // Get count for each table
    for (const row of tableQuery.rows) {
      const tableName = row.table_name
      const countQuery = await db.rawQuery(`SELECT COUNT(*) FROM "${tableName}"`)
      tables.push({
        name: tableName,
        count: Number.parseInt(countQuery.rows[0].count, 10),
      })
    }

    return {
      isConnected: true,
      tables,
    }
  } catch (error) {
    console.error("Database health check failed:", error)
    return {
      isConnected: false,
      tables: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
