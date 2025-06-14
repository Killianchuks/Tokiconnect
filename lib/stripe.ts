import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil", // Updated to the latest API version
  appInfo: {
    name: "Toki Connect",
    version: "1.0.0",
  },
})

export default stripe
