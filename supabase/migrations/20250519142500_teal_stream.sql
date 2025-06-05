-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can select their own account" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "users_admin_manage" ON users;
DROP POLICY IF EXISTS "users_manage_own" ON users;
DROP POLICY IF EXISTS "users_public_read" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public can read basic user info (username, displayName, bio, profileimage)
CREATE POLICY "users_public_read" ON users
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can read their own full data
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can manage all user data
CREATE POLICY "users_admin_manage" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND ((auth.users.raw_app_meta_data->>'isAdmin')::boolean = true)
    )
  );