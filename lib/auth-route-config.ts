export const USER_LOGIN_ROUTE = "/login"
export const ADMIN_LOGIN_ROUTE = "/admin/login"

export const AUTH_PAGE_ROUTES = [USER_LOGIN_ROUTE, ADMIN_LOGIN_ROUTE]

export const PUBLIC_PAGE_ROUTES = ["/", "/login", "/signup", "/test-route"]

export const PUBLIC_API_ENDPOINT_PATTERNS: RegExp[] = [
  /^\/auth\/login$/,
  /^\/auth\/admin\/login$/,
  /^\/auth\/register$/,
  /^\/auth\/signup$/,
  /^\/languages(?:\?.*)?$/,
  /^\/teachers(?:\?.*)?$/,
  /^\/teachers\/[^/]+(?:\?.*)?$/,
  /^\/teachers\/[^/]+\/reviews(?:\?.*)?$/,
]

export function isPublicApiEndpoint(endpoint: string): boolean {
  return PUBLIC_API_ENDPOINT_PATTERNS.some((pattern) => pattern.test(endpoint))
}

export function isAuthPageRoute(pathname: string): boolean {
  return AUTH_PAGE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function isPublicPageRoute(pathname: string): boolean {
  return PUBLIC_PAGE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}
