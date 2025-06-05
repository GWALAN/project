/*
  # Fix Users Table RLS Policy for Onboarding

  1. Changes
    - Drop existing policies that might be causing conflicts
    - Create new policy to allow authenticated users to insert their own profile
    - Ensure public read access for user profiles
    - Allow users to update their own profile
    
  2. Security
    - Maintain RLS protection
    - Allow authenticated users to create their own profile
    - Prevent users from modifying other users' profiles
*/

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Users can create their own profile" ON users;
  DROP POLICY IF EXISTS "users_insert_own" ON users;
  DROP POLICY IF EXISTS "users_public_read" ON users;
  DROP POLICY IF EXISTS "users_update_own" ON users;
END $$;

-- Create new policies for users table
CREATE POLICY "users_insert_own_profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_public_read_profile"
ON users
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_update_own_profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Make sure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;