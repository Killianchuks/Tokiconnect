// Client-side authentication check

export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const userString = localStorage.getItem("linguaConnectUser")
    if (!userString) {
      return false
    }

    const user = JSON.parse(userString)
    return !!user && user.isLoggedIn
  } catch (error) {
    console.error("Error checking authentication:", error)
    return false
  }
}

export function getUserRole() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const userString = localStorage.getItem("linguaConnectUser")
    if (!userString) {
      return null
    }

    const user = JSON.parse(userString)
    return user.role || null
  } catch (error) {
    console.error("Error getting user role:", error)
    return null
  }
}

export function isAdmin() {
  return getUserRole() === "admin"
}

export function isTeacher() {
  return getUserRole() === "teacher"
}

export function isStudent() {
  return getUserRole() === "student"
}
