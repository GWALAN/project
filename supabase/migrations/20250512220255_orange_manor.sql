/*
  # Fix social links storage in profiles table

  1. Changes
    - Ensure externallinks column exists and has correct type
    - Add button_style column if it doesn't exist
    - Set default values
*/

-- Drop old columns if they exist
ALTER TABLE profiles DROP COLUMN IF EXISTS sociallinks;

-- Ensure externallinks column exists with correct type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'externallinks'
  ) THEN
    ALTER TABLE profiles ADD COLUMN externallinks jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'button_style'
  ) THEN
    ALTER TABLE profiles ADD COLUMN button_style text DEFAULT 'default';
  END IF;
END $$;

-- Update any NULL values to empty array
UPDATE profiles 
SET externallinks = '[]'::jsonb 
WHERE externallinks IS NULL;