/*
  # Fix layout column location

  1. Changes
    - Remove layout column from users table if it exists
    - Ensure layout column exists in profiles table
    - Add default value for layout column
*/

DO $$ 
BEGIN
  -- Remove layout column from users table if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'layout'
  ) THEN
    ALTER TABLE users DROP COLUMN layout;
  END IF;

  -- Add layout column to profiles table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'layout'
  ) THEN
    ALTER TABLE profiles ADD COLUMN layout text DEFAULT 'grid';
  END IF;
END $$;