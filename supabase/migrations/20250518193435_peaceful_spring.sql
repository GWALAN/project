-- Drop existing problematic policies
DROP POLICY IF EXISTS "Only admins can access admin stats" ON users;
DROP POLICY IF EXISTS "admin_access" ON users;

-- Create new admin policy without recursion
CREATE POLICY "admin_access"
ON users
FOR ALL 
TO authenticated
USING (
  current_setting('request.jwt.claims')::json->>'role' = 'admin'
)
WITH CHECK (
  current_setting('request.jwt.claims')::json->>'role' = 'admin'
);

-- Ensure other basic policies exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
ON users
FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public can read user profiles" ON users;
CREATE POLICY "Public can read user profiles"
ON users
FOR SELECT
USING (true);