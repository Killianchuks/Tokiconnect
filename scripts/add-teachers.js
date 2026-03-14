const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
})

const teachers = [
  {
    firstName: "Maria",
    lastName: "Garcia",
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    role: "teacher",
    languages: ["spanish", "english"],
    hourlyRate: 25,
    rating: 4.9,
    bio: "Native Spanish speaker with 5 years of teaching experience. Specialized in conversational Spanish for beginners and intermediate learners.",
    availability: JSON.stringify([
      { day: "Monday", slots: ["9:00 - 11:00", "14:00 - 16:00"], startTime: "09:00" },
      { day: "Wednesday", slots: ["10:00 - 12:00", "15:00 - 17:00"], startTime: "10:00" },
      { day: "Friday", slots: ["9:00 - 11:00", "13:00 - 15:00"], startTime: "09:00" },
    ]),
    specialties: ["Conversational", "Business Spanish", "DELE Prep"],
    status: "active",
  },
  {
    firstName: "Jean",
    lastName: "Dupont",
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    role: "teacher",
    languages: ["french", "english"],
    hourlyRate: 30,
    rating: 4.8,
    bio: "French teacher with a focus on grammar and pronunciation. I help students achieve fluency through structured lessons and practical exercises.",
    availability: JSON.stringify([
      { day: "Tuesday", slots: ["8:00 - 10:00", "16:00 - 18:00"], startTime: "08:00" },
      { day: "Thursday", slots: ["9:00 - 11:00", "15:00 - 17:00"], startTime: "09:00" },
      { day: "Saturday", slots: ["10:00 - 13:00"], startTime: "10:00" },
    ]),
    specialties: ["Grammar", "Pronunciation", "DELF Prep"],
    status: "active",
  },
  {
    firstName: "Hiroshi",
    lastName: "Tanaka",
    name: "Hiroshi Tanaka",
    email: "hiroshi.tanaka@example.com",
    role: "teacher",
    languages: ["japanese", "english"],
    hourlyRate: 28,
    rating: 4.7,
    bio: "Tokyo native teaching Japanese for 7 years. I specialize in helping students master kanji and natural conversation patterns.",
    availability: JSON.stringify([
      { day: "Monday", slots: ["18:00 - 20:00"], startTime: "18:00" },
      { day: "Wednesday", slots: ["18:00 - 20:00"], startTime: "18:00" },
      { day: "Saturday", slots: ["9:00 - 12:00", "14:00 - 16:00"], startTime: "09:00" },
    ]),
    specialties: ["Kanji", "Conversation", "JLPT Prep"],
    status: "active",
  },
  {
    firstName: "Anna",
    lastName: "Schmidt",
    name: "Anna Schmidt",
    email: "anna.schmidt@example.com",
    role: "teacher",
    languages: ["german", "english"],
    hourlyRate: 27,
    rating: 4.9,
    bio: "German language instructor with a background in linguistics. My teaching approach focuses on practical communication skills and cultural context.",
    availability: JSON.stringify([
      { day: "Tuesday", slots: ["10:00 - 12:00", "17:00 - 19:00"], startTime: "10:00" },
      { day: "Thursday", slots: ["10:00 - 12:00", "17:00 - 19:00"], startTime: "10:00" },
      { day: "Sunday", slots: ["14:00 - 17:00"], startTime: "14:00" },
    ]),
    specialties: ["Business German", "Grammar", "TestDaF Prep"],
    status: "active",
  },
  {
    firstName: "Li",
    lastName: "Wei",
    name: "Li Wei",
    email: "li.wei@example.com",
    role: "teacher",
    languages: ["mandarin", "english"],
    hourlyRate: 26,
    rating: 4.8,
    bio: "Mandarin teacher from Beijing with 6 years of experience. I help students master tones and characters through interactive lessons.",
    availability: JSON.stringify([
      { day: "Monday", slots: ["8:00 - 10:00", "19:00 - 21:00"], startTime: "08:00" },
      { day: "Wednesday", slots: ["8:00 - 10:00", "19:00 - 21:00"], startTime: "08:00" },
      { day: "Friday", slots: ["19:00 - 21:00"], startTime: "19:00" },
    ]),
    specialties: ["HSK Prep", "Conversation", "Business Chinese"],
    status: "active",
  },
  {
    firstName: "Sofia",
    lastName: "Rossi",
    name: "Sofia Rossi",
    email: "sofia.rossi@example.com",
    role: "teacher",
    languages: ["italian", "english"],
    hourlyRate: 24,
    rating: 4.7,
    bio: "Italian language enthusiast from Florence. My lessons combine grammar, vocabulary, and cultural insights to provide a comprehensive learning experience.",
    availability: JSON.stringify([
      { day: "Tuesday", slots: ["9:00 - 11:00", "15:00 - 17:00"], startTime: "09:00" },
      { day: "Thursday", slots: ["9:00 - 11:00", "15:00 - 17:00"], startTime: "09:00" },
      { day: "Saturday", slots: ["11:00 - 14:00"], startTime: "11:00" },
    ]),
    specialties: ["Conversational", "Culture", "CILS Prep"],
    status: "active",
  },
]

async function addTeachers() {
  const client = await pool.connect()
  
  try {
    console.log("Adding teacher columns to users table if they don't exist...")
    
    // Add name column first if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name VARCHAR(255)
    `)
    
    // Add teacher-specific columns if they don't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 25,
      ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 4.5,
      ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS profile_image TEXT,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'
    `)
    
    console.log("Columns added/verified successfully")
    
    console.log("Adding teachers to the database...")
    
    for (const teacher of teachers) {
      // Check if teacher already exists
      const existingTeacher = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [teacher.email]
      )
      
      if (existingTeacher.rows.length > 0) {
        console.log(`Teacher ${teacher.name} already exists, updating...`)
        await client.query(
          `UPDATE users SET
            name = $1,
            role = $2,
            languages = $3,
            hourly_rate = $4,
            rating = $5,
            bio = $6,
            availability = $7,
            specialties = $8,
            status = $9
          WHERE email = $10`,
          [
            teacher.name,
            teacher.role,
            teacher.languages,
            teacher.hourlyRate,
            teacher.rating,
            teacher.bio,
            teacher.availability,
            teacher.specialties,
            teacher.status,
            teacher.email,
          ]
        )
      } else {
        console.log(`Adding new teacher: ${teacher.name}`)
        // Generate a default password for the teacher
        const defaultPassword = await bcrypt.hash("Teacher123!", 10)
        await client.query(
          `INSERT INTO users (first_name, last_name, name, email, password, role, languages, hourly_rate, rating, bio, availability, specialties, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
          [
            teacher.firstName,
            teacher.lastName,
            teacher.name,
            teacher.email,
            defaultPassword,
            teacher.role,
            teacher.languages,
            teacher.hourlyRate,
            teacher.rating,
            teacher.bio,
            teacher.availability,
            teacher.specialties,
            teacher.status,
          ]
        )
      }
    }
    
    console.log("All teachers added successfully!")
    
    // Verify teachers
    const result = await client.query("SELECT id, name, email, role, languages, hourly_rate, rating FROM users WHERE role = 'teacher'")
    console.log("\nTeachers in database:")
    console.table(result.rows)
    
  } catch (error) {
    console.error("Error adding teachers:", error)
  } finally {
    client.release()
    await pool.end()
  }
}

addTeachers()
