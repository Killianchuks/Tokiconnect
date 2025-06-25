interface PaginatedQueryOptions {
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Builds a SQL query string with pagination (LIMIT and OFFSET).
 * @param baseQuery The base SQL query string (e.g., "SELECT * FROM users WHERE status = 'active'").
 * Do NOT include ORDER BY, LIMIT, or OFFSET in the baseQuery.
 * @param page The current page number (1-indexed).
 * @param pageSize The number of items per page.
 * @param existingParams Optional array of parameters already used in the baseQuery's WHERE clause.
 * @param options Additional pagination/sorting options.
 * @returns An object containing the full paginated query string and the combined parameters array.
 */
export function buildPaginatedQuery(
  baseQuery: string,
  page: number,
  pageSize: number,
  existingParams: any[] = [],
  options?: { sortField?: string; sortOrder?: 'ASC' | 'DESC' }
) {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  let fullQuery = baseQuery;
  const params = [...existingParams];

  // Add ORDER BY clause if specified
  if (options?.sortField) {
    // Basic sanitization for sortField to prevent SQL injection for column names
    const sanitizedSortField = options.sortField.replace(/[^a-zA-Z0-9_.]/g, ''); // Allow alphanumeric, underscore, dot
    const sortOrder = options.sortOrder || 'ASC'; // Default to ASC

    if (['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      fullQuery += ` ORDER BY ${sanitizedSortField} ${sortOrder}`;
    } else {
      console.warn(`Invalid sortOrder: ${sortOrder}. Defaulting to ASC.`);
      fullQuery += ` ORDER BY ${sanitizedSortField} ASC`;
    }
  }

  // Add LIMIT and OFFSET, using new parameter indices
  fullQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  return { query: fullQuery, params };
}
