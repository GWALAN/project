/*
  # Add profileImage column to users table

  1. Changes
    - Add profileImage column to users table as nullable text field
    - Make it nullable since not all users will have a profile image initially
*/

-- Add profileImage column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'profileImage'
  ) THEN
    ALTER TABLE users ADD COLUMN "profileImage" text;
  END IF;
END $$;