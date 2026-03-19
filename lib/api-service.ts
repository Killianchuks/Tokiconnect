// API service for handling all data operations
import { toast } from "@/hooks/use-toast"
import { USER_LOGIN_ROUTE, isAuthPageRoute, isPublicApiEndpoint } from "@/lib/auth-route-config"

// Base URL for API calls
const API_BASE_URL = "/api"

function getAdminFallbackHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {}

  const storedUser = localStorage.getItem("linguaConnectUser") || localStorage.getItem("adminSession")
  if (!storedUser) return {}

  try {
    const parsed = JSON.parse(storedUser) as { id?: string; role?: string }
    if (!parsed.id || parsed.role !== "admin") return {}

    return {
      "x-user-id": String(parsed.id),
      "x-user-role": "admin",
    }
  } catch {
    return {}
  }
}

function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null

  const directToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
  if (directToken) return directToken

  const storedUser = localStorage.getItem("linguaConnectUser")
  if (!storedUser) return null

  try {
    const parsedUser = JSON.parse(storedUser) as { token?: string }
    return parsedUser.token || null
  } catch {
    return null
  }
}

function handleUnauthorized(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("auth_token")
  sessionStorage.removeItem("auth_token")
  localStorage.removeItem("linguaConnectUser")

  const currentPath = `${window.location.pathname}${window.location.search}`
  const onAuthPage = isAuthPageRoute(window.location.pathname)

  if (!onAuthPage) {
    const callbackUrl = encodeURIComponent(currentPath || "/dashboard")
    window.location.href = `${USER_LOGIN_ROUTE}?callbackUrl=${callbackUrl}`
  }
}

// Generic fetch function with error handling
async function fetchData<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    const token = getStoredAuthToken()

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    }

    if (token && !Object.keys(headers as Record<string, string>).some((key) => key.toLowerCase() === "authorization")) {
      ;(headers as Record<string, string>).Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
      ...options,
      credentials: "include",
      headers,
    })

    if (response.status === 401 && !isPublicApiEndpoint(normalizedEndpoint)) {
      handleUnauthorized()
      throw new Error("Session expired. Please log in again.")
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "An error occurred" }))
      throw new Error(errorData.message || `Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API Error:", error)
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An error occurred while fetching data",
      variant: "destructive",
    })
    throw error
  }
}

// Safely handle API calls with fallback data
async function safeApiCall<T>(apiCall: () => Promise<T>, fallbackData: T): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    console.error("API call failed, using fallback data:", error)
    return fallbackData
  }
}

// User related API calls
export const userService = {
  getUsers: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    console.log("Fetching users with query:", `/admin/users${queryParams}`)
    return safeApiCall(() => fetchData<any[]>(`/admin/users${queryParams}`), [])
  },

  getUserById: async (id: string) => {
    return safeApiCall(() => fetchData<any>(`/users/${id}`), null)
  },

  createUser: async (userData: any) => {
    return fetchData<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  updateUser: async (id: string, userData: any) => {
    return fetchData<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  },

  deleteUser: async (id: string) => {
    return fetchData<void>(`/users/${id}`, {
      method: "DELETE",
    })
  },

  suspendUser: async (id: string) => {
    return fetchData<any>(`/users/${id}/suspend`, {
      method: "POST",
    })
  },

  activateUser: async (id: string) => {
    return fetchData<any>(`/users/${id}/activate`, {
      method: "POST",
    })
  },

  getUserStats: async () => {
    return safeApiCall(
      async () => {
        const response = await fetch("/api/admin/stats/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAdminFallbackHeaders(),
          },
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user statistics")
        }

        return await response.json()
      },
      { totalUsers: 0, activeUsers: 0, growthRate: 0 },
    )
  },

  getFinanceStats: async () => {
    return safeApiCall(
      async () => {
        const response = await fetch("/api/admin/stats/finances", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAdminFallbackHeaders(),
          },
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch finance statistics")
        }

        return await response.json()
      },
      { totalRevenue: 0, growthRate: 0 },
    )
  },
}

// Teacher related API calls
export const teacherService = {
  getTeachers: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    return safeApiCall(() => fetchData<any[]>(`/teachers${queryParams}`), [])
  },

  getTeacherById: async (id: string) => {
    if (!id) {
      throw new Error("Invalid teacher ID")
    }
    return safeApiCall(() => fetchData<any>(`/teachers/${id}`), null)
  },

  createTeacher: async (teacherData: any) => {
    return fetchData<any>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...teacherData, role: "teacher" }),
    })
  },

  updateTeacher: async (id: string, teacherData: any) => {
    return fetchData<any>(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(teacherData),
    })
  },

  approveTeacher: async (id: string) => {
    return fetchData<any>(`/teachers/${id}/approve`, {
      method: "POST",
    })
  },

  rejectTeacher: async (id: string) => {
    return fetchData<any>(`/teachers/${id}/reject`, {
      method: "POST",
    })
  },

  getTeacherStats: async () => {
    return safeApiCall(
      async () => {
        const response = await fetch("/api/admin/stats/teachers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAdminFallbackHeaders(),
          },
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch teacher statistics")
        }

        return await response.json()
      },
      { totalTeachers: 0, pendingTeachers: 0, growthRate: 0 },
    )
  },
}

// Lesson related API calls
export const lessonService = {
  getLessons: async (userId?: string, filters?: Record<string, any>) => {
    const queryParams = new URLSearchParams(filters || {})
    if (userId) queryParams.append("userId", userId)

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return safeApiCall(() => fetchData<any[]>(`/lessons${queryString}`), [])
  },

  bookLesson: async (lessonData: any) => {
    return fetchData<any>("/lessons", {
      method: "POST",
      body: JSON.stringify(lessonData),
    })
  },

  cancelLesson: async (id: string) => {
    return fetchData<any>(`/lessons/${id}/cancel`, {
      method: "POST",
    })
  },

  rateLesson: async (id: string, rating: number, feedback?: string) => {
    return fetchData<any>(`/lessons/${id}/rate`, {
      method: "POST",
      body: JSON.stringify({ rating, feedback }),
    })
  },

  getLessonStats: async () => {
    return safeApiCall(
      async () => {
        const response = await fetch("/api/admin/stats/lessons", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAdminFallbackHeaders(),
          },
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch lesson statistics")
        }

        return await response.json()
      },
      { totalLessons: 0, growthRate: 0 },
    )
  },
}

// Review related API calls
export const reviewService = {
  getReviews: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    return safeApiCall(() => fetchData<{ reviews: any[]; averageRating: number }>(`/reviews${queryParams}`), {
      reviews: [],
      averageRating: 0,
    })
  },

  getTeacherReviews: async (teacherId: string) => {
    if (!teacherId) {
      throw new Error("Invalid teacher ID")
    }
    return safeApiCall(() => fetchData<{ reviews: any[]; averageRating: number }>(`/teachers/${teacherId}/reviews`), {
      reviews: [],
      averageRating: 0,
    })
  },

  submitReview: async (reviewData: {
    teacherId: string
    lessonId: string
    rating: number
    comment?: string
  }) => {
    return fetchData<any>("/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    })
  },
}

// Finance related API calls
export const financeService = {
  getTransactions: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    return safeApiCall(() => fetchData<any[]>(`/transactions${queryParams}`), [])
  },

  getPayouts: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    return safeApiCall(() => fetchData<any[]>(`/payouts${queryParams}`), [])
  },

  processPayouts: async (payoutData: any) => {
    return fetchData<any>("/payouts", {
      method: "POST",
      body: JSON.stringify(payoutData),
    })
  },

  getCommissionSettings: async () => {
    return safeApiCall(() => fetchData<any>("/commission-settings"), { teacherCommission: 80, platformFee: 20 })
  },

  updateCommissionSettings: async (settingsData: any) => {
    return fetchData<any>("/commission-settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    })
  },
}

// Language related API calls
export const languageService = {
  getLanguages: async () => {
    return safeApiCall(() => fetchData<any[]>("/languages"), [])
  },

  addLanguage: async (languageData: any) => {
    return fetchData<any>("/languages", {
      method: "POST",
      body: JSON.stringify(languageData),
    })
  },

  updateLanguage: async (id: string, languageData: any) => {
    return fetchData<any>(`/languages/${id}`, {
      method: "PUT",
      body: JSON.stringify(languageData),
    })
  },

  deleteLanguage: async (id: string) => {
    return fetchData<void>(`/languages/${id}`, {
      method: "DELETE",
    })
  },
}

// Analytics related API calls
export const analyticsService = {
  getDashboardStats: async () => {
    return safeApiCall(
      async () => {
        // Fetch all stats in parallel
        const [userStats, teacherStats, lessonStats, financeStats] = await Promise.all([
          userService.getUserStats(),
          teacherService.getTeacherStats(),
          lessonService.getLessonStats(),
          userService.getFinanceStats(),
        ])

        // Format the revenue for display
        const formattedRevenue = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(financeStats.totalRevenue || 0)

        return {
          users: {
            total: userStats.totalUsers || 0,
            growth: userStats.growthRate || 0,
            active: userStats.activeUsers || 0,
          },
          teachers: {
            total: teacherStats.totalTeachers || 0,
            growth: teacherStats.growthRate || 0,
            active: teacherStats.totalTeachers - (teacherStats.pendingTeachers || 0),
          },
          lessons: {
            total: lessonStats.totalLessons || 0,
            growth: lessonStats.growthRate || 0,
            completed: lessonStats.totalLessons || 0, // Assuming all lessons are completed for now
          },
          revenue: {
            total: financeStats.totalRevenue || 0,
            growth: financeStats.growthRate || 0,
            formatted: formattedRevenue,
          },
        }
      },
      {
        users: { total: 0, growth: 0, active: 0 },
        teachers: { total: 0, growth: 0, active: 0 },
        lessons: { total: 0, growth: 0, completed: 0 },
        revenue: { total: 0, growth: 0, formatted: "$0.00" },
      },
    )
  },

  getUserStats: async (period?: string) => {
    const queryParams = period ? `?period=${period}` : ""
    return safeApiCall(() => fetchData<any>(`/analytics/users${queryParams}`), { users: [], growth: 0 })
  },

  getRevenueStats: async (period?: string) => {
    const queryParams = period ? `?period=${period}` : ""
    return safeApiCall(() => fetchData<any>(`/analytics/revenue${queryParams}`), { revenue: [], growth: 0 })
  },

  getTeacherStats: async (period?: string) => {
    const queryParams = period ? `?period=${period}` : ""
    return safeApiCall(() => fetchData<any>(`/analytics/teachers${queryParams}`), { teachers: [], growth: 0 })
  },
}

// Support related API calls
export const supportService = {
  getTickets: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    return safeApiCall(() => fetchData<any[]>(`/support/tickets${queryParams}`), [])
  },

  getTicketById: async (id: string) => {
    return safeApiCall(() => fetchData<any>(`/support/tickets/${id}`), null)
  },

  createTicket: async (ticketData: any) => {
    return fetchData<any>("/support/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    })
  },

  updateTicket: async (id: string, ticketData: any) => {
    return fetchData<any>(`/support/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(ticketData),
    })
  },

  closeTicket: async (id: string) => {
    return fetchData<any>(`/support/tickets/${id}/close`, {
      method: "POST",
    })
  },

  getSupportStats: async () => {
    return safeApiCall(
      async () => {
        const response = await fetch("/api/admin/stats/support", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAdminFallbackHeaders(),
          },
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch support statistics")
        }

        const data = await response.json()

        // Add additional stats for the UI
        return {
          totalTickets: data.totalTickets || 0,
          openTickets: data.openTickets || 0,
          inProgressTickets: data.inProgressTickets || 0,
          avgResponseTime: data.avgResponseTime || "N/A",
        }
      },
      { totalTickets: 0, openTickets: 0, inProgressTickets: 0, avgResponseTime: "N/A" },
    )
  },
}

// Settings related API calls
export const settingsService = {
  getSettings: async () => {
    return safeApiCall(() => fetchData<any>("/settings"), {})
  },

  updateSettings: async (settingsData: any) => {
    return fetchData<any>("/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    })
  },
}

// Report related API calls
export const reportService = {
  generateReport: async (reportType: string, parameters: Record<string, any>) => {
    return fetchData<any>("/reports/generate", {
      method: "POST",
      body: JSON.stringify({ reportType, parameters }),
    })
  },

  getReportTypes: async () => {
    return safeApiCall(() => fetchData<any[]>("/reports/types"), [])
  },

  getReportById: async (id: string) => {
    return safeApiCall(() => fetchData<any>(`/reports/${id}`), null)
  },
}

// Authentication related API calls
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return fetchData<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  adminLogin: async (credentials: { email: string; password: string }) => {
    return fetchData<any>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  logout: async () => {
    return fetchData<void>("/auth/logout", {
      method: "POST",
    })
  },

  getCurrentUser: async () => {
    return safeApiCall(() => fetchData<any>("/auth/me"), null)
  },
}
