/*
  # Update users table RLS policies with JWT-based admin check

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper access control:
      - Public read access for basic profile info
      - Authenticated users can manage their own data
      - Admin access based on JWT claims
    
  2. Security
    - Use JWT claims for admin verification
    - Maintain proper access control
    - Prevent unauthorized modifications
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Public can read user profiles" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "authenticated_update_own_profile" ON users;
DROP POLICY IF EXISTS "authenticated_insert_own_profile" ON users;
DROP POLICY IF EXISTS "users_public_read" ON users;
DROP POLICY IF EXISTS "users_manage_own" ON users;
DROP POLICY IF EXISTS "users_admin_manage" ON users;

-- Create new simplified policies
CREATE POLICY "users_public_read"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "users_manage_own"
ON users
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_admin_manage"
ON users
FOR ALL
TO authenticated
USING (
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