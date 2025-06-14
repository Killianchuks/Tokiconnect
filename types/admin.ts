export interface User {
    id: string
    name: string
    email: string
    role: "student" | "teacher" | "admin"
    status: "active" | "suspended" | "pending"
    joinDate: string
    language?: string
    rating?: number
  }
  
  export interface UserFilters {
    role: string
    status: string
    sortBy: string
  }
  
  export interface NewUser {
    firstName: string
    lastName: string
    email: string
    password: string
    role: "student" | "teacher" | "admin"
    language?: string
  }
  