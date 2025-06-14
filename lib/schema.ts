import { pgTable, text, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
  language: text("language"),
  hourlyRate: integer("hourly_rate"),
  bio: text("bio"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  teacherLessons: many(lessons, { relationName: "teacher_lessons" }),
  studentLessons: many(lessons, { relationName: "student_lessons" }),
  receivedReviews: many(reviews, { relationName: "teacher_reviews" }),
  givenReviews: many(reviews, { relationName: "student_reviews" }),
}))

// Lessons table
export const lessons = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => users.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  language: text("language").notNull(),
  price: integer("price").notNull(), // in cents
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Lesson relations
export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  teacher: one(users, {
    fields: [lessons.teacherId],
    references: [users.id],
    relationName: "teacher_lessons",
  }),
  student: one(users, {
    fields: [lessons.studentId],
    references: [users.id],
    relationName: "student_lessons",
  }),
  reviews: many(reviews),
}))

// Reviews table
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => users.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
})

// Review relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
  lesson: one(lessons, {
    fields: [reviews.lessonId],
    references: [lessons.id],
  }),
  teacher: one(users, {
    fields: [reviews.teacherId],
    references: [users.id],
    relationName: "teacher_reviews",
  }),
  student: one(users, {
    fields: [reviews.studentId],
    references: [users.id],
    relationName: "student_reviews",
  }),
}))

// Languages table
export const languages = pgTable("languages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Support ticket relations
export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
}))
