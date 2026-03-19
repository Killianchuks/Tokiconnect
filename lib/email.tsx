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

export async function sendMeetingLinkEmail(
  email: string,
  recipientName: string,
  meetingLink: string,
  lessonTime: string,
  partnerName: string
): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(email)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`Your Toki Connect Lesson Meeting Link`)
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">Your Lesson is Confirmed</h2>
        <p>Hi ${recipientName || "there"},</p>
        <p>Your lesson with <strong>${partnerName}</strong> is confirmed for <strong>${lessonTime}</strong>.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Join meeting:</strong></p>
          <p style="margin: 0;"><a href="${meetingLink}" target="_blank" rel="noopener noreferrer">${meetingLink}</a></p>
        </div>
        <p>Please join the meeting at the scheduled time.</p>
        <p style="margin-top: 20px; color: #666;">Thank you for using Toki Connect!</p>
      </div>
    `)
    .setText(`Your lesson with ${partnerName} is confirmed for ${lessonTime}. Join the meeting here: ${meetingLink}`)

  await mailerSend.email.send(emailParams)
}

export async function sendNewMessageEmail(
  email: string,
  recipientName: string,
  senderName: string,
  messageExcerpt: string,
  lessonDate: string,
  lessonLink?: string
): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(email)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`New message from ${senderName} on Toki Connect`)
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">You have a new message</h2>
        <p>Hi ${recipientName || "there"},</p>
        <p><strong>${senderName}</strong> just sent you a message about the lesson on <strong>${lessonDate}</strong>.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">${messageExcerpt}</p>
        </div>
        ${lessonLink ? `<p><a href="${lessonLink}" target="_blank" rel="noopener noreferrer">View your messages</a></p>` : ""}
        <p style="margin-top: 20px; color: #666;">Thanks for using Toki Connect!</p>
      </div>
    `)
    .setText(`New message from ${senderName} about your lesson on ${lessonDate}: ${messageExcerpt}`)

  await mailerSend.email.send(emailParams)
}

export async function sendTeacherLessonBookedEmail(
  teacherEmail: string,
  teacherName: string,
  studentName: string,
  lessonDate: string,
  lessonDuration: number,
  lessonLanguage: string
): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(teacherEmail)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`New Lesson Booked - Add Meeting Link Required`)
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">New Lesson Booked!</h2>
        <p>Hi ${teacherName || "there"},</p>
        <p><strong>${studentName}</strong> has booked a lesson with you!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Lesson Details:</strong></p>
          <p style="margin: 0 0 5px 0;">📅 Date & Time: ${lessonDate}</p>
          <p style="margin: 0 0 5px 0;">⏱️ Duration: ${lessonDuration} minutes</p>
          <p style="margin: 0 0 5px 0;">🌍 Language: ${lessonLanguage}</p>
        </div>
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #8B5A2B; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>⚠️ Action Required:</strong></p>
          <p style="margin: 0;">You must add a meeting link (Zoom, Teams, Google Meet, etc.) for this lesson before it begins.</p>
          <p style="margin: 10px 0 0 0;">Go to your <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/schedule" target="_blank" rel="noopener noreferrer">Schedule</a> to add the meeting link.</p>
        </div>
        <p>The student will receive a confirmation email with the meeting link once you add it.</p>
        <p style="margin-top: 20px; color: #666;">Thank you for teaching on Toki Connect!</p>
      </div>
    `)
    .setText(`New lesson booked with ${studentName} on ${lessonDate} (${lessonDuration} minutes, ${lessonLanguage}). Please add a meeting link in your schedule dashboard.`)

  await mailerSend.email.send(emailParams)
}

export async function sendStudentLessonConfirmedEmail(
  studentEmail: string,
  studentName: string,
  teacherName: string,
  lessonDate: string,
  lessonDuration: number,
  lessonLanguage: string,
  meetingLink: string
): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(studentEmail)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`Your Lesson is Confirmed - Meeting Link Ready`)
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">Your Lesson is Confirmed!</h2>
        <p>Hi ${studentName || "there"},</p>
        <p>Your lesson with <strong>${teacherName}</strong> is now confirmed and ready to go!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Lesson Details:</strong></p>
          <p style="margin: 0 0 5px 0;">👨‍🏫 Teacher: ${teacherName}</p>
          <p style="margin: 0 0 5px 0;">📅 Date & Time: ${lessonDate}</p>
          <p style="margin: 0 0 5px 0;">⏱️ Duration: ${lessonDuration} minutes</p>
          <p style="margin: 0 0 5px 0;">🌍 Language: ${lessonLanguage}</p>
        </div>
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>🎥 Join Your Lesson:</strong></p>
          <p style="margin: 0 0 5px 0;">Click the link below to join your lesson:</p>
          <p style="margin: 5px 0 0 0;"><a href="${meetingLink}" target="_blank" rel="noopener noreferrer" style="color: #8B5A2B; font-weight: bold;">${meetingLink}</a></p>
        </div>
        <p>Please join the meeting at the scheduled time. If you have any questions, you can message your teacher through the platform.</p>
        <p style="margin-top: 20px; color: #666;">Thank you for learning with Toki Connect!</p>
      </div>
    `)
    .setText(`Your lesson with ${teacherName} is confirmed! Join here: ${meetingLink}. Lesson details: ${lessonDate}, ${lessonDuration} minutes, ${lessonLanguage}.`)

  await mailerSend.email.send(emailParams)
}

export async function sendMeetingLinkUpdatedEmail(
  studentEmail: string,
  studentName: string,
  teacherName: string,
  lessonDate: string,
  meetingLink: string
): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(studentEmail)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`Meeting Link Updated for Your Lesson`)
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">Meeting Link Updated</h2>
        <p>Hi ${studentName || "there"},</p>
        <p><strong>${teacherName}</strong> has updated the meeting link for your lesson on <strong>${lessonDate}</strong>.</p>
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>🎥 Updated Meeting Link:</strong></p>
          <p style="margin: 0 0 5px 0;">Click the link below to join your lesson:</p>
          <p style="margin: 5px 0 0 0;"><a href="${meetingLink}" target="_blank" rel="noopener noreferrer" style="color: #8B5A2B; font-weight: bold;">${meetingLink}</a></p>
        </div>
        <p>Please use this updated link for your upcoming lesson. If you have any questions, you can message your teacher through the platform.</p>
        <p style="margin-top: 20px; color: #666;">Thank you for learning with Toki Connect!</p>
      </div>
    `)
    .setText(`${teacherName} has updated the meeting link for your lesson on ${lessonDate}. New link: ${meetingLink}`)

  await mailerSend.email.send(emailParams)
}

export async function sendLessonCanceledEmail(
  recipientEmail: string,
  recipientName: string,
  canceledByName: string,
  lessonDate: string,
  lessonLanguage: string,
): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(recipientEmail)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("Lesson Cancelled - Toki Connect")
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Lesson Cancelled</h2>
        <p>Hi ${recipientName || "there"},</p>
        <p>Your lesson scheduled for <strong>${lessonDate}</strong> has been cancelled by <strong>${canceledByName}</strong>.</p>
        <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <p style="margin: 0;"><strong>Language:</strong> ${lessonLanguage || "Language lesson"}</p>
        </div>
        <p>You can book a new time from your dashboard when ready.</p>
        <p style="margin-top: 20px; color: #666;">Thank you for using Toki Connect.</p>
      </div>
    `)
    .setText(`Your lesson on ${lessonDate} has been cancelled by ${canceledByName}. Language: ${lessonLanguage || "Language lesson"}.`)

  await mailerSend.email.send(emailParams)
}

export async function sendLessonRescheduledEmail(
  recipientEmail: string,
  recipientName: string,
  rescheduledByName: string,
  oldLessonDate: string,
  newLessonDate: string,
  lessonLanguage: string,
): Promise<void> {
  const sentFrom = new Sender(senderEmail, senderName)
  const recipients = [new Recipient(recipientEmail)]

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("Lesson Rescheduled - Toki Connect")
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A2B;">Lesson Rescheduled</h2>
        <p>Hi ${recipientName || "there"},</p>
        <p><strong>${rescheduledByName}</strong> has rescheduled your lesson.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Previous time:</strong> ${oldLessonDate}</p>
          <p style="margin: 0;"><strong>New time:</strong> ${newLessonDate}</p>
        </div>
        <p><strong>Language:</strong> ${lessonLanguage || "Language lesson"}</p>
        <p style="margin-top: 20px; color: #666;">Please review your schedule and confirm availability.</p>
      </div>
    `)
    .setText(`Your lesson has been rescheduled by ${rescheduledByName}. Old time: ${oldLessonDate}. New time: ${newLessonDate}. Language: ${lessonLanguage || "Language lesson"}.`)

  await mailerSend.email.send(emailParams)
}
