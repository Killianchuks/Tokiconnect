import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.MAILERSEND_API_KEY
  const fromEmail = process.env.EMAIL_FROM
  const fromName = process.env.EMAIL_FROM_NAME || "Toki Connect"
  
  // Check configuration
  const config = {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + "..." : null,
    fromEmail: fromEmail || "NOT SET",
    fromName: fromName,
  }
  
  if (!apiKey || !fromEmail) {
    return NextResponse.json({
      success: false,
      error: "Missing configuration",
      config,
      message: "Please ensure MAILERSEND_API_KEY and EMAIL_FROM are set in environment variables"
    })
  }
  
  // Test sending an email to a test address
  try {
    const testEmail = "test@example.com" // This won't actually send, just validates the API
    
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: [
          {
            email: testEmail,
          },
        ],
        subject: "Test Email",
        html: "<p>Test</p>",
      }),
    })

    const responseText = await response.text()
    let responseJson = null
    try {
      responseJson = JSON.parse(responseText)
    } catch {
      // Response might not be JSON
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseJson || responseText,
      config,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      config,
    })
  }
}
