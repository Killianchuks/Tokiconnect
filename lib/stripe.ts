import Stripe from "stripe"

let stripeInstance: Stripe | null = null

// Lazy initialization to avoid errors during build when env vars aren't available
function getStripeInstance(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not defined")
  }

  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-03-31.basil", // Updated to the latest API version
    appInfo: {
      name: "Toki Connect",
      version: "1.0.0",
    },
  })

  return stripeInstance
}

// Create a transparent proxy that lazily initializes Stripe on first use
const stripe = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = getStripeInstance()
    return instance[prop as keyof Stripe]
  },
})

export default stripe
