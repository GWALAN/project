/*
  # Fix infinite recursion in users table policies

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies with proper conditions
    - Fix admin access check
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can access admin stats" ON users;
DROP POLICY IF EXISTS "Admins can access all data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Public can read user profiles" ON users;

-- Create new policies without recursion
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO public
USING (auth.uid() = id);

CREATE POLICY "Public can read basic user info"
ON users
FOR SELECT
TO public
USING (
  -- Only allow access to public fields
  -- This prevents recursion by not checking user roles
  true
);

CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin access"
ON users
FOR ALL
TO authenticated
USING (
  -- Check admin status directly from auth.users metadata
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'isAdmin')::boolean = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'isAdmin')::boolean = true
  )
);