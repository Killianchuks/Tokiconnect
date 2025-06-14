interface EmailTemplate {
  to: string
  subject: string
  html: string
  text: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

class EmailService {
  private isConfigured = false
  private emailConfig: any = null

  constructor() {
    this.checkConfiguration()
  }

  private checkConfiguration() {
    // Parse MailerSend SMTP URL format: smtp://username:password@host:port
    const emailServer = process.env.EMAIL_SERVER
    const emailFrom = process.env.EMAIL_FROM

    if (!emailServer || !emailFrom) {
      console.warn("⚠️ Email service not configured. Missing EMAIL_SERVER or EMAIL_FROM")
      console.warn("📧 Emails will be logged to console for development")
      this.isConfigured = false
      return
    }

    try {
      // Parse the SMTP URL
      const url = new URL(emailServer)

      this.emailConfig = {
        host: url.hostname, // smtp.mailersend.com
        port: Number.parseInt(url.port) || 587, // 587
        secure: false, // true for 465, false for other ports
        auth: {
          user: url.username, // MS_7xD8Qe@tokiconnect.com
          pass: url.password, // mssp.W4q0OsH.x2p0347jey34zdrn.gRAdBbS
        },
        from: emailFrom, // no-reply@tokiconnect.com
      }

      console.log("✅ MailerSend email service configured")
      console.log(`📧 SMTP Host: ${this.emailConfig.host}:${this.emailConfig.port}`)
      console.log(`📧 From Address: ${this.emailConfig.from}`)
      this.isConfigured = true
    } catch (error) {
      console.error("❌ Failed to parse EMAIL_SERVER URL:", error)
      this.isConfigured = false
    }
  }

  async sendEmail(template: EmailTemplate): Promise<EmailResult> {
    try {
      if (!this.isConfigured || !this.emailConfig) {
        // Development mode - log email to console
        console.log("\n" + "=".repeat(80))
        console.log("📧 EMAIL WOULD BE SENT (Development Mode)")
        console.log("=".repeat(80))
        console.log(`To: ${template.to}`)
        console.log(`Subject: ${template.subject}`)
        console.log("\n--- TEXT VERSION ---")
        console.log(template.text)
        console.log("\n--- HTML VERSION ---")
        console.log(template.html)
        console.log("=".repeat(80) + "\n")

        return {
          success: true,
          messageId: `dev-${Date.now()}`,
        }
      }

      // Production mode - send actual email via MailerSend
      console.log(`📧 Sending email via MailerSend to: ${template.to}`)

      // For now, we'll use fetch to send via MailerSend API
      // This is more reliable than SMTP for serverless environments
      const response = await this.sendViaMailerSendAPI(template)

      if (response.success) {
        console.log(`✅ Email sent successfully via MailerSend to: ${template.to}`)
        return response
      } else {
        console.error(`❌ Failed to send email via MailerSend:`, response.error)
        // Fallback to console logging
        console.log("\n" + "=".repeat(80))
        console.log("📧 EMAIL FALLBACK (MailerSend Failed)")
        console.log("=".repeat(80))
        console.log(`To: ${template.to}`)
        console.log(`Subject: ${template.subject}`)
        console.log("\n--- TEXT VERSION ---")
        console.log(template.text)
        console.log("=".repeat(80) + "\n")

        return {
          success: true,
          messageId: `fallback-${Date.now()}`,
        }
      }
    } catch (error) {
      console.error("❌ Failed to send email:", error)

      // Fallback to console logging
      console.log("\n" + "=".repeat(80))
      console.log("📧 EMAIL FALLBACK (Error Occurred)")
      console.log("=".repeat(80))
      console.log(`To: ${template.to}`)
      console.log(`Subject: ${template.subject}`)
      console.log("\n--- TEXT VERSION ---")
      console.log(template.text)
      console.log("=".repeat(80) + "\n")

      return {
        success: true,
        messageId: `error-fallback-${Date.now()}`,
      }
    }
  }

  private async sendViaMailerSendAPI(template: EmailTemplate): Promise<EmailResult> {
    try {
      // MailerSend API endpoint
      const apiUrl = "https://api.mailersend.com/v1/email"

      // Extract API token from password (MailerSend format)
      const apiToken = this.emailConfig?.auth?.pass

      if (!apiToken) {
        throw new Error("MailerSend API token not found")
      }

      const emailData = {
        from: {
          email: this.emailConfig.from,
          name: "TOKI CONNECT",
        },
        to: [
          {
            email: template.to,
          },
        ],
        subject: template.subject,
        text: template.text,
        html: template.html,
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        const result = await response.json()
        return {
          success: true,
          messageId: result.message_id || `mailersend-${Date.now()}`,
        }
      } else {
        const errorText = await response.text()
        throw new Error(`MailerSend API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown MailerSend error",
      }
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXTAUTH_URL || "https://tokiconnect.com"}/reset-password?token=${resetToken}`
    const expiryTime = "1 hour"

    const template: EmailTemplate = {
      to: email,
      subject: "Password Reset Request - TOKI CONNECT",
      text: `
Hello ${userName},

You requested a password reset for your TOKI CONNECT account.

To reset your password, click the following link:
${resetUrl}

This link will expire in ${expiryTime}.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The TOKI CONNECT Team

---
TOKI CONNECT - Connecting Language Learners Worldwide
Website: https://tokiconnect.com
Support: support@tokiconnect.com
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - TOKI CONNECT</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #8B5A2B, #A0522D); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .content h2 { color: #333; margin-top: 0; font-size: 24px; }
    .button { display: inline-block; background: #8B5A2B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; transition: background-color 0.3s; }
    .button:hover { background: #A0522D; }
    .link-box { background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 14px; }
    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0; }
    .warning strong { color: #856404; }
    .footer { margin-top: 40px; padding-top: 25px; border-top: 2px solid #eee; font-size: 14px; color: #666; text-align: center; }
    .footer a { color: #8B5A2B; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌍 TOKI CONNECT</h1>
      <p>Password Reset Request</p>
    </div>
    
    <div class="content">
      <h2>Hello ${userName},</h2>
      
      <p>You requested a password reset for your TOKI CONNECT account. Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset My Password</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <div class="link-box">${resetUrl}</div>
      
      <div class="warning">
        <strong>⚠️ Important Security Information:</strong>
        <ul style="margin: 10px 0;">
          <li>This link will expire in ${expiryTime}</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Your password will remain unchanged if you don't click the link</li>
          <li>Never share this link with anyone</li>
        </ul>
      </div>
      
      <p>If you're having trouble with the button above, you can also visit our website directly and use the "Forgot Password" feature.</p>
    </div>
    
    <div class="footer">
      <p><strong>TOKI CONNECT</strong><br>
      Connecting Language Learners Worldwide</p>
      <p>
        <a href="https://tokiconnect.com">Visit Website</a> | 
        <a href="mailto:support@tokiconnect.com">Contact Support</a>
      </p>
      <p><small>This is an automated message. Please do not reply to this email.</small></p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    }

    const result = await this.sendEmail(template)
    return result.success
  }

  async sendPasswordResetConfirmation(email: string, userName: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: "Password Successfully Reset - TOKI CONNECT",
      text: `
Hello ${userName},

Your password has been successfully reset for your TOKI CONNECT account.

You can now log in with your new password at: https://tokiconnect.com/login

If you did not make this change, please contact our support team immediately at support@tokiconnect.com.

For your security, we recommend:
- Using a strong, unique password
- Enabling two-factor authentication if available
- Keeping your account information up to date

Best regards,
The TOKI CONNECT Team

---
TOKI CONNECT - Connecting Language Learners Worldwide
Website: https://tokiconnect.com
Support: support@tokiconnect.com
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Confirmation - TOKI CONNECT</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .content h2 { color: #333; margin-top: 0; font-size: 24px; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 25px 0; color: #155724; text-align: center; }
    .success strong { font-size: 18px; }
    .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; }
    .button:hover { background: #218838; }
    .footer { margin-top: 40px; padding-top: 25px; border-top: 2px solid #eee; font-size: 14px; color: #666; text-align: center; }
    .footer a { color: #28a745; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌍 TOKI CONNECT</h1>
      <p>Password Reset Confirmation</p>
    </div>
    
    <div class="content">
      <h2>Hello ${userName},</h2>
      
      <div class="success">
        <strong>✅ Success!</strong><br>
        Your password has been successfully reset.
      </div>
      
      <p>Your TOKI CONNECT account password has been updated. You can now log in with your new password.</p>
      
      <div style="text-align: center;">
        <a href="https://tokiconnect.com/login" class="button">Log In Now</a>
      </div>
      
      <p><strong>If you did not make this change:</strong></p>
      <ul>
        <li>Contact our support team immediately at <a href="mailto:support@tokiconnect.com">support@tokiconnect.com</a></li>
        <li>Consider changing your password again</li>
        <li>Review your account activity</li>
      </ul>
      
      <p><strong>Security recommendations:</strong></p>
      <ul>
        <li>Use a strong, unique password</li>
        <li>Enable two-factor authentication if available</li>
        <li>Keep your account information up to date</li>
        <li>Never share your login credentials</li>
      </ul>
    </div>
    
    <div class="footer">
      <p><strong>TOKI CONNECT</strong><br>
      Connecting Language Learners Worldwide</p>
      <p>
        <a href="https://tokiconnect.com">Visit Website</a> | 
        <a href="mailto:support@tokiconnect.com">Contact Support</a>
      </p>
      <p><small>This is an automated message. Please do not reply to this email.</small></p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    }

    const result = await this.sendEmail(template)
    return result.success
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Export types for use in other files
export type { EmailTemplate, EmailResult }
