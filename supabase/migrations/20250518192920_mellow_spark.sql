/*
  # Fix infinite recursion in user policies

  1. Changes
    - Drop problematic policies causing recursion
    - Create new policies using JWT claims
    - Ensure proper access control without self-referencing
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Only admins can access admin stats" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Public can read user profiles" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "public_read_basic_info" ON users;
DROP POLICY IF EXISTS "public_read_users" ON users;
DROP POLICY IF EXISTS "users_manage_own_profile" ON users;

-- Create new policies without recursion
CREATE POLICY "users_read_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_public_read"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "users_admin_access"
ON users FOR ALL
TO authenticated
USING (
  coalesce(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    'authenticated'
  ) = 'service_role'
);