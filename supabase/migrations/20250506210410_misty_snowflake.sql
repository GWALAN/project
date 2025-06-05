/*
  # Fix external links storage in profiles table

  1. Changes
    - Ensure externallinks column exists
    - Set default value as empty array
    - Update column type to JSONB for better performance
*/

-- Add externallinks column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'externallinks'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN externallinks JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Update any NULL values to empty array
UPDATE profiles 
SET externallinks = '[]'::jsonb 
WHERE externallinks IS NULL;