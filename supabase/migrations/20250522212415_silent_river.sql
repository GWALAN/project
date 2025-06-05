/*
  # Delete all users and fix RLS policies

  1. Changes
    - Delete all existing users from the database
    - Fix RLS policies to prevent infinite recursion
    - Create simplified policies for users table
    
  2. Security
    - Maintain RLS protection
    - Allow authenticated users to create their own profile
    - Prevent users from modifying other users' profiles
*/

-- Delete all existing users
DELETE FROM auth.users;

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