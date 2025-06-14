-- Initialize database schema for TOKI CONNECT
-- This script creates all necessary tables in the correct order

-- Drop existing tables if they exist (for development only)
-- DROP TABLE IF EXISTS teachers CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Create users table first (no dependencies)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'student',
  status VARCHAR(50) DEFAULT 'active',
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  last_login TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create teachers table (depends on users)
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2) DEFAULT 25.00,
  years_of_experience INTEGER DEFAULT 0,
  bio TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_active ON teachers(active);

-- Insert sample data for testing (optional)
INSERT INTO users (name, email, password, role) VALUES 
  ('Test Student', 'student@example.com', '$2b$10$example', 'student'),
  ('Test Teacher', 'teacher@example.com', '$2b$10$example', 'teacher'),
  ('Admin User', 'admin@tokiconnect.com', '$2b$10$example', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Verify tables were created
SELECT 'Users table created' as status, COUNT(*) as count FROM users;
SELECT 'Teachers table created' as status, COUNT(*) as count FROM teachers;
