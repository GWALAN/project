/*
  # Fix profiles table schema

  1. Changes
    - Drop old externallinks column if it exists
    - Add new sociallinks column with proper default value
    - Update RLS policies to ensure proper access

  2. Security
    - Maintain existing RLS policies
    - Ensure public read access
    - Allow users to manage their own profiles
*/

-- Drop old column and add new one
DO $$ 
BEGIN
  -- Drop old column if it exists
  ALTER TABLE profiles DROP COLUMN IF EXISTS externallinks;

  -- Add new column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'sociallinks'
  ) THEN
    ALTER TABLE profiles ADD COLUMN sociallinks jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

CREATE POLICY "Public can read profiles"
ON profiles
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can manage own profile"
ON profiles
FOR ALL
TO authenticated
USING (auth.uid() = userid)
WITH CHECK (auth.uid() = userid);