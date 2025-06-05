-- Delete all users from public.users table first (to avoid foreign key constraints)
DELETE FROM public.users;

-- Delete all users from auth.users table
DELETE FROM auth.users;

-- Make sure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the users table to start fresh
DO $$ 
BEGIN
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