/**
 * Safe localStorage wrapper that handles exceptions
 */
export const clientStorage = {
    get: (key: string): string | null => {
      try {
        if (typeof window === "undefined") return null
        return localStorage.getItem(key)
      } catch (e) {
        console.error(`Error getting item ${key} from localStorage:`, e)
        return null
      }
    },
  
    set: (key: string, value: string): boolean => {
      try {
        if (typeof window === "undefined") return false
        localStorage.setItem(key, value)
        return true
      } catch (e) {
        console.error(`Error setting item ${key} in localStorage:`, e)
        return false
      }
    },
  
    remove: (key: string): boolean => {
      try {
        if (typeof window === "undefined") return false
        localStorage.removeItem(key)
        return true
      } catch (e) {
        console.error(`Error removing item ${key} from localStorage:`, e)
        return false
      }
    },
  
    clear: (): boolean => {
      try {
        if (typeof window === "undefined") return false
        localStorage.clear()
        return true
      } catch (e) {
        console.error("Error clearing localStorage:", e)
        return false
      }
    },
  }
  