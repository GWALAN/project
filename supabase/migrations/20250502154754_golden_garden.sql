/*
  # Add external links column to profiles table

  1. Changes
    - Add `externalLinks` column to `profiles` table with JSONB type and default empty array
    - This column will store an array of link objects with title and URL

  2. Security
    - No changes to RLS policies needed as the existing policies cover the new column
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'externallinks'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN externallinks JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;