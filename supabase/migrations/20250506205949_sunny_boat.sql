/*
  # Add externallinks column to profiles table

  1. Changes
    - Add `externallinks` column to `profiles` table
      - Type: JSONB
      - Default: Empty array
      - Purpose: Store external links for user profiles

  2. Notes
    - Uses JSONB type for flexible link storage
    - Default value ensures no null entries
    - Maintains existing RLS policies
*/

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