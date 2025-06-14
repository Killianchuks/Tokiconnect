export interface UserProfile {
    id?: string | number
    firstName: string
    lastName: string
    email: string
    role: "student" | "teacher" | "admin"
    language?: string
    hourlyRate?: string | number
  }
  