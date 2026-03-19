import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

type MissingField = "language" | "price" | "bio"

function isMissingLanguage(user: any): boolean {
  return !user?.language || String(user.language).trim() === ""
}

function isMissingPrice(user: any): boolean {
  return user?.hourly_rate === null || user?.hourly_rate === undefined || Number(user.hourly_rate) <= 0
}

function isMissingBio(user: any): boolean {
  return !user?.bio || String(user.bio).trim() === ""
}

function formatMissingFields(user: any): string {
  const missing: string[] = []

  if (isMissingLanguage(user)) missing.push("language")
  if (isMissingPrice(user)) missing.push("price")
  if (isMissingBio(user)) missing.push("bio")

  if (missing.length === 0) return "profile details"
  if (missing.length === 1) return missing[0]
  if (missing.length === 2) return `${missing[0]} and ${missing[1]}`
  return `${missing[0]}, ${missing[1]}, and ${missing[2]}`
}

function personalizeMessage(template: string, user: any): string {
  const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "there"
  return template
    .replaceAll("{name}", displayName)
    .replaceAll("{email}", String(user.email || ""))
    .replaceAll("{role}", String(user.role || "user"))
    .replaceAll("{missingFields}", formatMissingFields(user))
}

function normalizeMissingFields(input: unknown): MissingField[] {
  return (Array.isArray(input) ? input : [])
    .map((field: unknown) => String(field).trim().toLowerCase())
    .filter((field: string): field is MissingField => field === "language" || field === "price" || field === "bio")
}

function buildRecipientsQuery(filters: {
  role: string
  status: string
  search: string
  missingFields: MissingField[]
}) {
  const { role, status, search, missingFields } = filters

  let usersQuery =
    "SELECT id, email, first_name, last_name, role, language, hourly_rate, bio, status FROM users WHERE role != 'admin'"
  const queryParams: any[] = []

  if (role !== "all") {
    queryParams.push(role)
    usersQuery += ` AND role = $${queryParams.length}`
  }

  if (status !== "all") {
    queryParams.push(status)
    usersQuery += ` AND status = $${queryParams.length}`
  }

  if (search) {
    queryParams.push(`%${search}%`)
    usersQuery += ` AND (email ILIKE $${queryParams.length} OR first_name ILIKE $${queryParams.length} OR last_name ILIKE $${queryParams.length})`
  }

  if (missingFields.includes("language")) {
    usersQuery += " AND (language IS NULL OR TRIM(language) = '')"
  }

  if (missingFields.includes("price")) {
    usersQuery += " AND (hourly_rate IS NULL OR hourly_rate <= 0)"
  }

  if (missingFields.includes("bio")) {
    usersQuery += " AND (bio IS NULL OR TRIM(bio) = '')"
  }

  usersQuery += " ORDER BY created_at DESC LIMIT 2000"

  return { usersQuery, queryParams }
}

async function insertTicketWithFallback(recipient: any, subject: string, message: string, adminId: string) {
  const attempts: Array<{ sql: string; params: any[] }> = [
    {
      sql: `INSERT INTO support_tickets (user_id, subject, description, category, priority, status, assigned_to)
            VALUES ($1, $2, $3, 'general', 'medium', 'in_progress', $4)
            RETURNING id`,
      params: [recipient.id, subject, message, adminId],
    },
    {
      sql: `INSERT INTO support_tickets (user_id, subject, description, category, priority, status)
            VALUES ($1, $2, $3, 'general', 'medium', 'in_progress')
            RETURNING id`,
      params: [recipient.id, subject, message],
    },
    {
      sql: `INSERT INTO support_tickets (user_id, subject, message, status)
            VALUES ($1, $2, $3, 'in_progress')
            RETURNING id`,
      params: [recipient.id, subject, message],
    },
    {
      sql: `INSERT INTO support_tickets (user_id, subject, message)
            VALUES ($1, $2, $3)
            RETURNING id`,
      params: [recipient.id, subject, message],
    },
  ]

  let lastError: unknown = null
  for (const attempt of attempts) {
    try {
      const ticketResult = await db.rawQuery(attempt.sql, attempt.params)
      const ticketId = ticketResult.rows[0]?.id
      if (ticketId) return ticketId
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to create support ticket")
}

async function insertMessageWithFallback(ticketId: string, adminId: string, message: string) {
  const attempts: Array<{ sql: string; params: any[] }> = [
    {
      sql: `INSERT INTO support_ticket_messages (ticket_id, sender_id, message, is_admin_reply)
            VALUES ($1, $2, $3, true)`,
      params: [ticketId, adminId, message],
    },
    {
      sql: `INSERT INTO support_ticket_messages (ticket_id, sender_id, message, is_admin)
            VALUES ($1, $2, $3, true)`,
      params: [ticketId, adminId, message],
    },
    {
      sql: `INSERT INTO support_ticket_messages (ticket_id, sender_id, message)
            VALUES ($1, $2, $3)`,
      params: [ticketId, adminId, message],
    },
  ]

  for (const attempt of attempts) {
    try {
      await db.rawQuery(attempt.sql, attempt.params)
      return true
    } catch {
      // Try next compatible schema variant.
    }
  }

  return false
}

async function getAdminUserFromRequest(request: Request) {
  const token = await auth.getAuthCookie()
  let user: any = token ? auth.verifyToken(token) : null

  if (!user) {
    const userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")
    if (userId && userRole === "admin") {
      user = { id: userId, role: userRole }
    }
  }

  return user
}

async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
  const result = await db.rawQuery(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      LIMIT 1
    `,
    [tableName, columnName],
  )

  return result.rows.length > 0
}

async function ensureBulkReportTables() {
  await db.rawQuery(
    `
      CREATE TABLE IF NOT EXISTS admin_bulk_message_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        message_template TEXT NOT NULL,
        role_filter TEXT,
        status_filter TEXT,
        missing_fields TEXT,
        total_recipients INTEGER NOT NULL DEFAULT 0,
        sent_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        message_logged_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `,
    [],
  )

  await db.rawQuery(
    `
      CREATE TABLE IF NOT EXISTS admin_bulk_message_report_recipients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES admin_bulk_message_reports(id) ON DELETE CASCADE,
        user_id TEXT,
        email TEXT,
        name TEXT,
        role TEXT,
        missing_fields TEXT,
        status TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `,
    [],
  )

  await db.rawQuery(
    "CREATE INDEX IF NOT EXISTS idx_admin_bulk_reports_admin_created_at ON admin_bulk_message_reports(admin_id, created_at DESC)",
    [],
  )
  await db.rawQuery(
    "CREATE INDEX IF NOT EXISTS idx_admin_bulk_report_recipients_report_id ON admin_bulk_message_report_recipients(report_id)",
    [],
  )
}

async function persistBulkReport(params: {
  adminId: string
  subject: string
  messageTemplate: string
  role: string
  status: string
  missingFields: MissingField[]
  totalRecipients: number
  sentCount: number
  failedCount: number
  messageLoggedCount: number
  sentRecipients: Array<{ id: string; email: string; name: string; role: string; missingFields: string }>
  failedRecipients: Array<{ id: string; email: string; name: string; reason: string }>
}) {
  await ensureBulkReportTables()

  const reportResult = await db.rawQuery(
    `
      INSERT INTO admin_bulk_message_reports (
        admin_id,
        subject,
        message_template,
        role_filter,
        status_filter,
        missing_fields,
        total_recipients,
        sent_count,
        failed_count,
        message_logged_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `,
    [
      params.adminId,
      params.subject,
      params.messageTemplate,
      params.role,
      params.status,
      params.missingFields.join(","),
      params.totalRecipients,
      params.sentCount,
      params.failedCount,
      params.messageLoggedCount,
    ],
  )

  const reportId = reportResult.rows[0]?.id
  if (!reportId) return

  for (const recipient of params.sentRecipients) {
    await db.rawQuery(
      `
        INSERT INTO admin_bulk_message_report_recipients (
          report_id,
          user_id,
          email,
          name,
          role,
          missing_fields,
          status,
          reason
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'sent', NULL)
      `,
      [
        reportId,
        recipient.id,
        recipient.email,
        recipient.name,
        recipient.role,
        recipient.missingFields,
      ],
    )
  }

  for (const recipient of params.failedRecipients) {
    await db.rawQuery(
      `
        INSERT INTO admin_bulk_message_report_recipients (
          report_id,
          user_id,
          email,
          name,
          role,
          missing_fields,
          status,
          reason
        )
        VALUES ($1, $2, $3, $4, NULL, NULL, 'failed', $5)
      `,
      [reportId, recipient.id, recipient.email, recipient.name, recipient.reason],
    )
  }
}

async function getLatestStoredBulkReport(adminId: string) {
  await ensureBulkReportTables()

  const reportResult = await db.rawQuery(
    `
      SELECT *
      FROM admin_bulk_message_reports
      WHERE admin_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [adminId],
  )

  const report = reportResult.rows[0]
  if (!report) return null

  const recipientsResult = await db.rawQuery(
    `
      SELECT user_id, email, name, role, missing_fields, status, reason
      FROM admin_bulk_message_report_recipients
      WHERE report_id = $1
      ORDER BY created_at ASC
    `,
    [report.id],
  )

  const sentRecipients = recipientsResult.rows
    .filter((row: any) => row.status === "sent")
    .map((row: any) => ({
      id: String(row.user_id || ""),
      email: String(row.email || ""),
      name: String(row.name || row.email || "Unknown"),
      role: String(row.role || "user"),
      missingFields: String(row.missing_fields || "profile details"),
    }))

  const failedRecipients = recipientsResult.rows
    .filter((row: any) => row.status === "failed")
    .map((row: any) => ({
      id: String(row.user_id || ""),
      email: String(row.email || ""),
      name: String(row.name || row.email || "Unknown"),
      reason: String(row.reason || "Unknown error"),
    }))

  return {
    source: "stored",
    subject: String(report.subject || ""),
    createdAt: report.created_at,
    sentCount: Number(report.sent_count || 0),
    failedCount: Number(report.failed_count || 0),
    messageLoggedCount: Number(report.message_logged_count || 0),
    totalRecipients: Number(report.total_recipients || 0),
    sentRecipients,
    failedRecipients,
  }
}

async function recoverLatestReportFromTickets(adminId: string) {
  const hasAssignedTo = await hasColumn("support_tickets", "assigned_to")
  if (!hasAssignedTo) return null

  const latestResult = await db.rawQuery(
    `
      SELECT subject, created_at
      FROM support_tickets
      WHERE assigned_to::text = $1::text
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [adminId],
  )

  const latest = latestResult.rows[0]
  if (!latest?.subject || !latest?.created_at) return null

  const recipientsResult = await db.rawQuery(
    `
      SELECT
        t.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.language,
        u.hourly_rate,
        u.bio
      FROM support_tickets t
      LEFT JOIN users u ON u.id::text = t.user_id::text
      WHERE t.assigned_to::text = $1::text
        AND t.subject = $2
        AND t.created_at >= ($3::timestamp - INTERVAL '30 minutes')
        AND t.created_at <= $3::timestamp
      ORDER BY t.created_at ASC
      LIMIT 2000
    `,
    [adminId, latest.subject, latest.created_at],
  )

  const sentRecipients = (recipientsResult.rows || []).map((row: any) => ({
    id: String(row.user_id || ""),
    email: String(row.email || ""),
    name: `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email || "Unknown",
    role: String(row.role || "user"),
    missingFields: formatMissingFields(row),
  }))

  if (sentRecipients.length === 0) return null

  return {
    source: "recovered",
    subject: String(latest.subject),
    createdAt: latest.created_at,
    sentCount: sentRecipients.length,
    failedCount: 0,
    messageLoggedCount: 0,
    totalRecipients: sentRecipients.length,
    sentRecipients,
    failedRecipients: [],
  }
}

export async function GET(request: Request) {
  try {
    const admin = await getAdminUserFromRequest(request)

    if (!admin || admin.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const stored = await getLatestStoredBulkReport(String(admin.id)).catch(() => null)
    if (stored) {
      return NextResponse.json({ success: true, report: stored })
    }

    const recovered = await recoverLatestReportFromTickets(String(admin.id)).catch(() => null)
    if (recovered) {
      return NextResponse.json({ success: true, report: recovered })
    }

    return NextResponse.json({ success: true, report: null })
  } catch (error) {
    console.error("Admin bulk message report GET error:", error)
    return NextResponse.json({ error: "Failed to load last bulk report" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminUserFromRequest(request)

    if (!admin || admin.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    const subject = String(body?.subject || "").trim()
    const messageTemplate = String(body?.messageTemplate || "").trim()
    const role = String(body?.role || "all").trim().toLowerCase()
    const status = String(body?.status || "all").trim().toLowerCase()
    const search = String(body?.search || "").trim()

    const previewOnly = Boolean(body?.previewOnly)
    const missingFields = normalizeMissingFields(body?.missingFields)

    if (!subject || !messageTemplate) {
      return NextResponse.json({ error: "subject and messageTemplate are required" }, { status: 400 })
    }

    if (missingFields.length === 0) {
      return NextResponse.json({ error: "At least one missing field must be selected" }, { status: 400 })
    }

    const { usersQuery, queryParams } = buildRecipientsQuery({
      role,
      status,
      search,
      missingFields,
    })

    const usersResult = await db.rawQuery(usersQuery, queryParams)
    const recipients = usersResult.rows || []

    if (previewOnly) {
      return NextResponse.json({
        success: true,
        previewOnly: true,
        totalRecipients: recipients.length,
        sampleRecipients: recipients.slice(0, 5).map((recipient: any) => ({
          id: recipient.id,
          email: recipient.email,
          name: `${recipient.first_name || ""} ${recipient.last_name || ""}`.trim() || recipient.email,
          role: recipient.role,
          missingFields: formatMissingFields(recipient),
        })),
      })
    }

    if (recipients.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        totalRecipients: 0,
      })
    }

    let sentCount = 0
    let failedCount = 0
    let messageLoggedCount = 0
    const sentRecipients: Array<{ id: string; email: string; name: string; role: string; missingFields: string }> = []
    const failedRecipients: Array<{ id: string; email: string; name: string; reason: string }> = []

    for (const recipient of recipients) {
      try {
        const message = personalizeMessage(messageTemplate, recipient)
        const recipientName = `${recipient.first_name || ""} ${recipient.last_name || ""}`.trim() || recipient.email

        const ticketId = await insertTicketWithFallback(recipient, subject, message, String(admin.id))
        if (!ticketId) {
          failedCount += 1
          failedRecipients.push({
            id: String(recipient.id),
            email: String(recipient.email || ""),
            name: recipientName,
            reason: "Ticket was not created",
          })
          continue
        }

        const messageSaved = await insertMessageWithFallback(String(ticketId), String(admin.id), message)
        if (messageSaved) {
          messageLoggedCount += 1
        }

        sentCount += 1
        sentRecipients.push({
          id: String(recipient.id),
          email: String(recipient.email || ""),
          name: recipientName,
          role: String(recipient.role || "user"),
          missingFields: formatMissingFields(recipient),
        })
      } catch (sendError) {
        console.error("Bulk message send error for user:", recipient?.id, sendError)
        failedCount += 1
        failedRecipients.push({
          id: String(recipient?.id || ""),
          email: String(recipient?.email || ""),
          name: `${recipient?.first_name || ""} ${recipient?.last_name || ""}`.trim() || recipient?.email || "Unknown",
          reason: sendError instanceof Error ? sendError.message : "Unknown error",
        })
      }
    }

    await persistBulkReport({
      adminId: String(admin.id),
      subject,
      messageTemplate,
      role,
      status,
      missingFields,
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
      messageLoggedCount,
      sentRecipients,
      failedRecipients,
    }).catch((error) => {
      console.error("Failed to persist bulk report:", error)
    })

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      messageLoggedCount,
      totalRecipients: recipients.length,
      sentRecipients,
      failedRecipients,
    })
  } catch (error) {
    console.error("Admin bulk message API error:", error)
    return NextResponse.json({ error: "Failed to send bulk messages" }, { status: 500 })
  }
}
