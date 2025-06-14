// Check if required environment variables are set
export function checkRequiredEnvVars() {
  const requiredVars = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ]

  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(", ")}`)
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
  }

  return true
}

// Get environment variable with fallback
export function getEnvVar(name: string, fallback = "") {
  const value = process.env[name]
  if (!value && process.env.NODE_ENV === "production") {
    console.error(`Missing environment variable in production: ${name}`)
  }
  return value || fallback
}
