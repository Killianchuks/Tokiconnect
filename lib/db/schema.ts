import { sql } from "drizzle-orm"
import { pgTable, text, integer, real, decimal, primaryKey } from "drizzle-orm/pg-core"

// Users table schema
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "teacher", "admin"] })
    .notNull()
    .default("student"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  defaultMeetingLink: text("default_meeting_link"),
    timezone: text("timezone"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
})

// Languages table schema
export const languages = pgTable("languages", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  flag: text("flag"),
})

// User languages (many-to-many relationship)
export const userLanguages = pgTable(
  "user_languages",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    languageId: text("language_id")
      .notNull()
      .references(() => languages.id, { onDelete: "cascade" }),
    proficiency: text("proficiency", { enum: ["beginner", "intermediate", "advanced", "native"] }).notNull(),
    isLearning: integer("is_learning", { mode: "boolean" }).notNull().default(true),
    isTeaching: integer("is_teaching", { mode: "boolean" }).notNull().default(false),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.languageId] }),
    }
  },
)

// Teachers table (extends users)
export const teachers = pgTable("teachers", {
  userId: text("user_id")
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hourlyRate: real("hourly_rate").notNull().default(25.0),
  yearsOfExperience: integer("years_of_experience").default(0),
  availability: text("availability").default("{}"),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  rating: real("rating").default(0),
  totalReviews: integer("total_reviews").default(0),
})

// Lessons table
export const lessons = pgTable("lessons", {
  id: text("id").primaryKey().notNull(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.userId, { onDelete: "cascade" }),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] })
    .notNull()
    .default("scheduled"),
  notes: text("notes"),
  studentTimezone: text("student_timezone"),
  // Additional columns from actual database
  type: text("type").default("single"),
  durationMinutes: integer("duration_minutes").default(60),
  language: text("language"),
  focus: text("focus"),
  meetingLink: text("meeting_link"),
  paymentId: text("payment_id"),
  paymentStatus: text("payment_status").default("pending"),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0"),
  cancelledAt: text("cancelled_at"),
  cancelledBy: text("cancelled_by"),
  cancellationReason: text("cancellation_reason"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
})

// Reviews table
export const reviews = pgTable("reviews", {
  id: text("id").primaryKey().notNull(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  reviewerId: text("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  revieweeId: text("reviewee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
})

// Messages table
export const messages = pgTable("messages", {
  id: text("id").primaryKey().notNull(),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: text("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
})

// Payments table
export const payments = pgTable("payments", {
  id: text("id").primaryKey().notNull(),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.userId, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status", { enum: ["pending", "completed", "failed", "refunded"] }).notNull(),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
})

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] })
    .notNull()
    .default("open"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
})
