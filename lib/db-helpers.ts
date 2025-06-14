/**
 * Builds a paginated query with proper parameter formatting for PostgreSQL
 *
 * @param baseQuery - The base SQL query without pagination
 * @param page - The page number (1-based)
 * @param pageSize - The number of items per page
 * @param params - Any existing parameters for the base query
 * @returns An object with the complete query string and parameters array
 */
export function buildPaginatedQuery(
    baseQuery: string,
    page = 1,
    pageSize = 10,
    params: any[] = [],
  ): { query: string; params: any[] } {
    // Validate and sanitize inputs
    const validPage = Math.max(1, Math.floor(Number(page) || 1))
  
    const validPageSize = Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 10)))
  
    // Calculate offset
    const offset = (validPage - 1) * validPageSize
  
    // For PostgreSQL, use direct integer values for LIMIT and OFFSET
    // This avoids the syntax error with parameterized LIMIT/OFFSET
    const query = `${baseQuery} LIMIT ${validPageSize} OFFSET ${offset}`
  
    return { query, params }
  }
  