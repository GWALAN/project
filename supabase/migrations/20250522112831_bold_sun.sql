-- First, drop all existing policies on the users table to start fresh
DO $$ 
BEGIN
  -- Drop all existing policies
  EXECUTE (
    SELECT string_agg(
      format('DROP POLICY IF EXISTS %I ON users', policyname),
      '; '
    )
    FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'public'
  );
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if no policies exist
END $$;

-- Make sure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy for public read access
CREATE POLICY "users_public_read_access"
ON users
FOR SELECT
TO public
USING (true);

-- Create a policy for authenticated users to insert their own profile
CREATE POLICY "users_insert_own_profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create a policy for authenticated users to update their own profile
CREATE POLICY "users_update_own_profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a policy for authenticated users to delete their own profile
CREATE POLICY "users_delete_own_profile"
ON users
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Create a policy for admins to manage all users
CREATE POLICY "users_admin_manage_all"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.isadmin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.isadmin = true
  )
);