-- Fix user data: populate name from first_name and last_name, and fix created_at

-- Update name field from first_name and last_name where name is null or empty
UPDATE users 
SET name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE (name IS NULL OR name = '' OR name = ' ')
AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Set default created_at for users where it's null
UPDATE users 
SET created_at = NOW() - INTERVAL '30 days'
WHERE created_at IS NULL;

-- Set status to 'active' for teachers where status is null or inactive
UPDATE users 
SET status = 'active'
WHERE role = 'teacher' AND (status IS NULL OR status = 'inactive');

-- Verify the updates
SELECT id, name, first_name, last_name, email, role, status, created_at 
FROM users 
WHERE role = 'teacher'
LIMIT 10;
