// Define the Teacher interface to be used across the application
export interface Teacher {
    id: number | string
    name: string
    bio?: string
    avatar?: string
    rating?: number
    reviewCount?: number
    hourlyRate: number
    discountPercent?: number
    specialties?: string[]
    languages: Array<string | { name: string; level?: string }>
    availability: Array<{
      day: string
      startTime?: string
      endTime?: string
      slots?: string[]
    }>
    trialClassAvailable?: boolean
    trialClassPrice?: number
    discounts?: {
      monthly4?: number
      monthly8?: number
      monthly12?: number
    }
    image?: string
  }
  