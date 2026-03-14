-- Drop existing tables if they have wrong schema
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

-- Create lessons table for tracking booked sessions
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  type VARCHAR(50) DEFAULT 'single',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  language VARCHAR(100),
  focus VARCHAR(100),
  notes TEXT,
  payment_id TEXT,
  payment_status VARCHAR(50) DEFAULT 'pending',
  amount DECIMAL(10,2) DEFAULT 0,
  cancelled_at TIMESTAMP,
  cancelled_by TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create transactions table for financial records
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  teacher_earnings DECIMAL(10,2) DEFAULT 0,
  type VARCHAR(50) DEFAULT 'lesson',
  status VARCHAR(50) DEFAULT 'pending',
  payment_id TEXT,
  stripe_payment_intent TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX idx_lessons_student_id ON lessons(student_id);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lessons_start_time ON lessons(start_time);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_teacher_id ON transactions(teacher_id);
CREATE INDEX idx_transactions_status ON transactions(status);
