/*
  # Fix users table RLS policies to prevent infinite recursion

  1. Changes
    - Drop all existing policies that could cause recursion
    - Create new simplified policies with proper access control
    - Separate public read access from authenticated operations
    - Fix admin access check to avoid self-referencing
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_public_read" ON users;
DROP POLICY IF EXISTS "users_admin_access" ON users;

-- Create new simplified policies
CREATE POLICY "users_public_read"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "users_manage_own"
ON users
FOR ALL
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Create admin policy without recursion
CREATE POLICY "users_admin_manage"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'isAdmin')::boolean = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'isAdmin')::boolean = true
  )
);