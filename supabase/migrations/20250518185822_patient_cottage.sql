/*
  # Fix infinite recursion in users table policies

  1. Changes
    - Drop existing policies that cause recursion
    - Create new simplified policies with proper access control
    - Use auth.users metadata for admin checks
    - Add separate policies for public and authenticated access
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admin access" ON users;
DROP POLICY IF EXISTS "Public can read basic user info" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new simplified policies
CREATE POLICY "public_read_users"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "authenticated_update_own_profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "authenticated_insert_own_profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_full_access"
ON users FOR ALL
TO authenticated
USING (
  coalesce(
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'isAdmin',
    'false'
  )::boolean
)
WITH CHECK (
  coalesce(
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'isAdmin',
    'false'
  )::boolean
);