-- Fix profiles table schema to match application code
DO $$ 
BEGIN
  -- Drop old column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'externallinks'
  ) THEN
    ALTER TABLE profiles DROP COLUMN externallinks;
  END IF;

  -- Add new column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'sociallinks'
  ) THEN
    ALTER TABLE profiles ADD COLUMN sociallinks jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Update existing rows to use the new column
  UPDATE profiles 
  SET sociallinks = '[]'::jsonb 
  WHERE sociallinks IS NULL;
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