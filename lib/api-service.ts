// API service for handling all data operations
import { toast } from "@/hooks/use-toast"

// Base URL for API calls
const API_BASE_URL = "/api"

// Generic fetch function with error handling
async function fetchData<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    })

    if (!response.ok) {
      let errorMessage = `Error: ${response.status}`

      try {
        const errorData = await response.json()
        if (typeof errorData.message === "string") {
          errorMessage = errorData.message
        } else if (typeof errorData.error === "string") {
          errorMessage = errorData.error
        }
      } catch (parseError) {
        console.warn("Failed to parse JSON from error response:", parseError)
      }

      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    console.error("API Error:", error)
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An error occurred while fetching data",
      variant: "destructive",
    })
    throw error // Re-throw to propagate error for `safeApiCall` and specific handlers
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

// Define common interfaces
interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export interface TeacherAvailability {
  day: string // E.g., "Monday"
  slots: string[] // E.g., ["09:00 - 11:00", "14:00 - 16:00"]
}

export interface TeacherDiscounts {
  monthly4: number // Percentage, e.g., 10 for 10%
  monthly8: number
  monthly12: number
}

export interface Teacher extends User {
  languages: string[]
  bio?: string
  hourlyRate: number
  rating: number
  students?: number
  createdAt: string;
  updatedAt: string;
  image?: string;
  reviews?: number;

  availability?: TeacherAvailability[];
  discounts?: TeacherDiscounts;
  trialClassAvailable?: boolean;
  trialClassPrice?: number;

  freeDemoAvailable?: boolean;
  freeDemoDuration?: number;
  defaultMeetingLink?: string | null; // ADDED: New field for meeting link
}

export interface TeacherCreateData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "teacher";
  languages: string[];
  bio?: string;
  hourlyRate: number;
}

export const userService = {
  getUsers: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    console.log("Fetching users with query:", `/admin/users${queryParams}`)
    const response = await safeApiCall(() => fetchData<{ users: User[], pagination: any }>(`/admin/users${queryParams}`), { users: [], pagination: {} });
    return response.users;
  },

  getUserById: async (id: string) => {
    return safeApiCall(() => fetchData<User>(`/admin/users/${id}`), null)
  },

  createUser: async (userData: any) => {
    return fetchData<User>("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  updateUser: async (id: string, userData: any) => {
    return fetchData<User>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(userData),
    })
  },

  deleteUser: async (id: string) => {
    return fetchData<void>(`/admin/users/${id}`, {
      method: "DELETE",
    })
  },

  suspendUser: async (id: string) => {
    return fetchData<User>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "suspended" }),
    })
  },

  activateUser: async (id: string) => {
    return fetchData<User>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active" }),
    })
  },

  getUserStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Error fetching user stats: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        growthRate: 0,
      }
    }
  },
}

interface TeacherService {
  getTeachers: (filters?: Record<string, any>) => Promise<Teacher[]>;
  getPublicTeachers: (filters?: Record<string, any>) => Promise<Teacher[]>;
  getTeacherById: (id: string) => Promise<Teacher | null>;
  createTeacher: (teacherData: TeacherCreateData) => Promise<Teacher>;
  updateTeacher: (id: string, teacherData: Partial<Omit<TeacherCreateData, 'password' | 'role' | 'email'> & { status?: string }>) => Promise<Teacher>;
  approveTeacher: (id: string) => Promise<any>;
  rejectTeacher: (id: string) => Promise<any>;
  getTeacherStats: () => Promise<any>;
  getMyProfile: () => Promise<Teacher | null>;
  // UPDATED: Added defaultMeetingLink to the updateMyProfile expected payload
  updateMyProfile: (teacherData: Partial<Omit<TeacherCreateData, 'password' | 'role' | 'email'> & {
    availability?: TeacherAvailability[],
    discounts?: TeacherDiscounts,
    trialClassAvailable?: boolean,
    trialClassPrice?: number,
    freeDemoAvailable?: boolean,
    freeDemoDuration?: number,
    defaultMeetingLink?: string | null // ADDED: New field
  }>) => Promise<Teacher>;
}

export const teacherService: TeacherService = {
  getTeachers: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    const response = await safeApiCall(() => fetchData<{ teachers: Teacher[], pagination: any }>(`/admin/teachers${queryParams}`), { teachers: [], pagination: {} });
    return response.teachers;
  },

  getPublicTeachers: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    const response = await safeApiCall(() => fetchData<{ teachers: Teacher[], pagination: any }>(`/teachers${queryParams}`), { teachers: [], pagination: {} });
    return response.teachers;
  },

  getTeacherById: async (id: string) => {
    if (typeof id !== 'string' || id.trim().length === 0) {
      console.warn(`[teacherService] Invalid ID passed to getTeacherById: "${id}". Skipping API call.`);
      return null;
    }
    return safeApiCall(() => fetchData<Teacher>(`/teachers/${id}`), null)
  },

  createTeacher: async (teacherData: TeacherCreateData) => {
    const backendPayload = {
      first_name: teacherData.firstName,
      last_name: teacherData.lastName,
      email: teacherData.email,
      password: teacherData.password,
      languages: teacherData.languages,
      bio: teacherData.bio,
      hourlyRate: teacherData.hourlyRate,
      role: "teacher"
    };
    const response = await fetchData<any>("/admin/teachers", {
      method: "POST",
      body: JSON.stringify(backendPayload),
    });
    return response.teacher;
  },

  updateTeacher: async (id: string, teacherData: Partial<Omit<TeacherCreateData, 'password' | 'role' | 'email'> & { status?: string }>) => {
    const backendPayload: any = {};
    if (teacherData.firstName !== undefined) backendPayload.first_name = teacherData.firstName;
    if (teacherData.lastName !== undefined) backendPayload.last_name = teacherData.lastName;
    if (teacherData.languages !== undefined) backendPayload.languages = teacherData.languages;
    if (teacherData.bio !== undefined) backendPayload.bio = teacherData.bio;
    if (teacherData.hourlyRate !== undefined) backendPayload.hourlyRate = teacherData.hourlyRate;
    if (teacherData.status !== undefined) backendPayload.status = teacherData.status;

    return fetchData<Teacher>(`/admin/teachers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(backendPayload),
    });
  },

  getMyProfile: async () => {
    return safeApiCall(() => fetchData<Teacher>("/teachers/me"), null);
  },

  updateMyProfile: async (teacherData) => { // Type inference relies on interface defined above
    const backendPayload: any = {};
    if (teacherData.firstName !== undefined) backendPayload.first_name = teacherData.firstName;
    if (teacherData.lastName !== undefined) backendPayload.last_name = teacherData.lastName;
    if (teacherData.languages !== undefined) backendPayload.languages = teacherData.languages;
    if (teacherData.bio !== undefined) backendPayload.bio = teacherData.bio;
    if (teacherData.hourlyRate !== undefined) backendPayload.hourlyRate = teacherData.hourlyRate;
    if (teacherData.availability !== undefined) backendPayload.availability = teacherData.availability;
    if (teacherData.discounts !== undefined) backendPayload.discounts = teacherData.discounts;
    if (teacherData.trialClassAvailable !== undefined) backendPayload.trialClassAvailable = teacherData.trialClassAvailable;
    if (teacherData.trialClassPrice !== undefined) backendPayload.trialClassPrice = teacherData.trialClassPrice;
    if (teacherData.freeDemoAvailable !== undefined) backendPayload.free_demo_available = teacherData.freeDemoAvailable;
    if (teacherData.freeDemoDuration !== undefined) backendPayload.free_demo_duration = teacherData.freeDemoDuration;
    if (teacherData.defaultMeetingLink !== undefined) backendPayload.default_meeting_link = teacherData.defaultMeetingLink; // ADDED: Map to snake_case for DB


    return fetchData<Teacher>("/teachers/me", {
      method: "PATCH",
      body: JSON.stringify(backendPayload),
    });
  },

  approveTeacher: async (id: string) => {
    return fetchData<Teacher>(`/admin/teachers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active" }),
    });
  },

  rejectTeacher: async (id: string) => {
    return fetchData<Teacher>(`/admin/teachers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "inactive" }),
    });
  },

  getTeacherStats: async () => {
    return safeApiCall(
      async () => {
        const response = await fetch(`${API_BASE_URL}/admin/stats/teachers`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
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
        const response = await fetch(`${API_BASE_URL}/admin/stats/lessons`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
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

export const reviewService = {
  getReviews: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    return safeApiCall(() => fetchData<{ reviews: any[]; averageRating: number }>(`/reviews${queryParams}`), {
      reviews: [],
      averageRating: 0,
    })
  },

  getTeacherReviews: async (teacherId: string) => {
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

export const financeService = {
  getTransactions: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    return safeApiCall(() => fetchData<any[]>(`/admin/transactions${queryParams}`), [])
  },

  getPayouts: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    return safeApiCall(() => fetchData<any[]>(`/admin/payouts${queryParams}`), [])
  },

  processPayouts: async (payoutData: any) => {
    return fetchData<any>("/admin/payouts", {
      method: "POST",
      body: JSON.stringify(payoutData),
    })
  },

  getCommissionSettings: async () => {
    return safeApiCall(() => fetchData<any>("/admin/commission-settings"), { teacherCommission: 80, platformFee: 20 })
  },

  updateCommissionSettings: async (settingsData: any) => {
    return fetchData<any>("/admin/commission-settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    })
  },

  getFinanceStats: async () => {
    return safeApiCall(
      async () => {
        const response = await fetch(`${API_BASE_URL}/admin/stats/finances`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
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

export const analyticsService = {
  getDashboardStats: async () => {
    return safeApiCall(
      async () => {
        const [userStats, teacherStats, lessonStats, financeStats, languageStats] = await Promise.all([
          userService.getUserStats(),
          teacherService.getTeacherStats(),
          lessonService.getLessonStats(),
          financeService.getFinanceStats(),
          statsService.getLanguageStats(),
        ])

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
            completed: lessonStats.totalLessons || 0,
          },
          revenue: {
            total: financeStats.totalRevenue || 0,
            growth: financeStats.growthRate || 0,
            formatted: formattedRevenue,
          },
          languages: {
            mostPopular: languageStats.mostPopular || "N/A",
            fastestGrowing: languageStats.fastestGrowing || "N/A",
          }
        }
      },
      {
        users: { total: 0, growth: 0, active: 0 },
        teachers: { total: 0, growth: 0, active: 0 },
        lessons: { total: 0, growth: 0, completed: 0 },
        revenue: { total: 0, growth: 0, formatted: "$0.00" },
        languages: { mostPopular: "N/A", fastestGrowing: "N/A" },
      },
    )
  },

  getUserStats: async (period?: string) => {
    const queryParams = period ? `?period=${period}` : ""
    return safeApiCall(() => fetchData<any>(`/admin/analytics/users${queryParams}`), { users: [], growth: 0 })
  },

  getRevenueStats: async (period?: string) => {
    const queryParams = period ? `?period=${period}` : ""
    return safeApiCall(() => fetchData<any>(`/admin/analytics/revenue${queryParams}`), { revenue: [], growth: 0 })
  },

  getTeacherStats: async (period?: string) => {
    const queryParams = period ? `?period=${period}` : ""
    return safeApiCall(() => fetchData<any>(`/admin/analytics/teachers${queryParams}`), { teachers: [], growth: 0 })
  },
}

export const supportService = {
  getTickets: async (filters?: Record<string, any>) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : ""
    return safeApiCall(() => fetchData<any[]>(`/admin/support/tickets${queryParams}`), [])
  },

  getTicketById: async (id: string) => {
    return safeApiCall(() => fetchData<any>(`/admin/support/tickets/${id}`), null)
  },

  createTicket: async (ticketData: any) => {
    return fetchData<any>("/admin/support/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    })
  },

  updateTicket: async (id: string, ticketData: any) => {
    return fetchData<any>(`/admin/support/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(ticketData),
    })
  },

  closeTicket: async (id: string) => {
    return fetchData<any>(`/admin/support/tickets/${id}/close`, {
      method: "POST",
    })
  },

  getSupportStats: async () => {
    return safeApiCall(
      async () => {
        const response = await fetch(`${API_BASE_URL}/admin/stats/support`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch support statistics")
        }

        const data = await response.json()

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

export const settingsService = {
  getSettings: async () => {
    return safeApiCall(() => fetchData<any>("/admin/settings"), {})
  },

  updateSettings: async (settingsData: any) => {
    return fetchData<any>("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    })
  },
}

export const reportService = {
  generateReport: async (reportType: string, parameters: Record<string, any>) => {
    return fetchData<any>("/admin/reports/generate", {
      method: "POST",
      body: JSON.stringify({ reportType, parameters }),
    })
  },

  getReportTypes: async () => {
    return safeApiCall(() => fetchData<any[]>("/admin/reports/types"), [])
  },

  getReportById: async (id: string) => {
    return safeApiCall(() => fetchData<any>(`/admin/reports/${id}`), null)
  },
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return fetchData<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  adminLogin: async (credentials: { email: string; password: string }) => {
    const response = await fetchData<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return response;
  },

  logout: async () => {
    return fetchData<void>("/auth/logout", {
      method: "POST",
    })
  },

  getCurrentUser: async () => {
    console.log("[api-service] authService.getCurrentUser: Attempting to fetch current user from /api/auth/me");
    try {
      const user = await fetchData<any>("/auth/me");
      console.log("[api-service] authService.getCurrentUser: Received user data:", user);
      return user;
    } catch (error) {
      console.error("[api-service] authService.getCurrentUser: Error fetching user:", error);
      return null;
    }
  },
}

export const statsService = {
  getLanguageStats: async () => {
    return safeApiCall(() => fetchData<any>("/admin/stats/languages"), {
      mostPopular: "N/A",
      fastestGrowing: "N/A",
    });
  },
};
