-- Update profiles table to use socialLinks instead of externalLinks
ALTER TABLE profiles 
  DROP COLUMN IF EXISTS externallinks,
  ADD COLUMN IF NOT EXISTS sociallinks jsonb DEFAULT '[]'::jsonb;

-- Update RLS policies
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read/write own profile" ON profiles;

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