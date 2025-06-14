import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, subject, category, message, to } = await request.json()

    // Validate the request
    if (!email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real application, you would send an email here
    // For example, using a service like SendGrid, Mailgun, or AWS SES

    // For now, we'll just log the message and return a success response
    console.log("Support request received:")
    console.log(`From: ${email}`)
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Category: ${category}`)
    console.log(`Message: ${message}`)

    // Simulate a delay to mimic sending an email
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing support request:", error)
    return NextResponse.json({ error: "Failed to process support request" }, { status: 500 })
  }
}
