-- Add email_verified column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Set existing users as verified (they were created before this feature)
UPDATE users SET email_verified = true WHERE email_verified IS NULL;
