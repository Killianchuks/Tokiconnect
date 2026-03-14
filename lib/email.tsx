import { MailerSend, EmailParams, Sender, Recipient } from "mailersend"

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
})

const senderEmail = process.env.EMAIL_FROM || "noreply@tokiconnect.com"
const senderName = process.env.EMAIL_FROM_NAME || "Toki Connect"

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(email)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("Verify Your Email - Toki Connect")
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">Verify Your Email</h2>
        <p>Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #8B5A2B;">
          ${code}
        </div>
        <p style="margin-top: 20px;">This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `)
    .setText(`Your Toki Connect verification code is: ${code}. This code expires in 10 minutes.`)

  await mailerSend.email.send(emailParams)
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(email)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("Reset Your Password - Toki Connect")
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">Reset Your Password</h2>
        <p>Your password reset code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #8B5A2B;">
          ${code}
        </div>
        <p style="margin-top: 20px;">This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `)
    .setText(`Your Toki Connect password reset code is: ${code}. This code expires in 10 minutes.`)

  await mailerSend.email.send(emailParams)
}

export async function sendTicketResolvedEmail(
  email: string, 
  userName: string,
  ticketSubject: string,
  ticketId: string,
  resolutionMessage?: string
): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(email)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`Your Support Ticket Has Been Resolved - Toki Connect`)
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">Support Ticket Resolved</h2>
        <p>Hi ${userName || "there"},</p>
        <p>Your support ticket has been resolved:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
          <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${ticketSubject}</p>
          <p style="margin: 0;"><strong>Status:</strong> <span style="color: #22c55e; font-weight: bold;">Resolved</span></p>
        </div>
        ${resolutionMessage ? `
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 5px 0;"><strong>Resolution Message:</strong></p>
          <p style="margin: 0;">${resolutionMessage}</p>
        </div>
        ` : ''}
        <p>If you have any further questions, feel free to create a new ticket or reply to continue this conversation.</p>
        <p style="margin-top: 20px; color: #666;">Thank you for using Toki Connect!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">
          This is an automated message from Toki Connect Support. Please do not reply directly to this email.
        </p>
      </div>
    `)
    .setText(`Hi ${userName || "there"}, Your support ticket "${ticketSubject}" (ID: ${ticketId}) has been resolved. ${resolutionMessage ? `Resolution: ${resolutionMessage}` : ''} Thank you for using Toki Connect!`)

  await mailerSend.email.send(emailParams)
}

export async function sendTicketUpdateEmail(
  email: string,
  userName: string,
  ticketSubject: string,
  ticketId: string,
  message: string
): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(email)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`New Reply to Your Support Ticket - Toki Connect`)
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">New Reply to Your Ticket</h2>
        <p>Hi ${userName || "there"},</p>
        <p>You have a new reply from our support team:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Ticket:</strong> ${ticketSubject}</p>
          <p style="margin: 0 0 10px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
        </div>
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #8B5A2B; margin: 20px 0;">
          <p style="margin: 0;">${message}</p>
        </div>
        <p>Log in to your account to view the full conversation and reply.</p>
        <p style="margin-top: 20px; color: #666;">Thank you for using Toki Connect!</p>
      </div>
    `)
    .setText(`Hi ${userName || "there"}, You have a new reply to your support ticket "${ticketSubject}" (ID: ${ticketId}): ${message}. Log in to view and reply.`)

  await mailerSend.email.send(emailParams)
}
