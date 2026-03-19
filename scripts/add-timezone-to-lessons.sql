-- Add timezone column to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS student_timezone TEXT;

-- Update existing lessons to have a default timezone (you may want to update this based on your needs)
UPDATE lessons SET student_timezone = 'America/New_York' WHERE student_timezone IS NULL;