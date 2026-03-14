// Utility function for making authenticated admin API requests
export function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {}
  
  const userData = localStorage.getItem("linguaConnectUser") || localStorage.getItem("adminSession")
  if (userData) {
    try {
      const user = JSON.parse(userData)
      return {
        "x-user-id": user.id || "",
        "x-user-role": user.role || "",
      }
    } catch {
      return {}
    }
  }
  return {}
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAdminAuthHeaders(),
    ...options.headers,
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}
