/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop all existing RLS policies on users table to avoid conflicts
    - Create comprehensive set of policies for users table:
      - Allow authenticated users to create their own profile
      - Allow users to read and update their own profile
      - Allow public read access for basic profile information
    
  2. Security
    - Ensure users can only create/modify their own profile
    - Maintain public read access for profiles
    - Prevent any unauthorized modifications
*/

-- First, drop all existing policies on the users table
DO $$ 
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "Users can create their own profile" ON users;
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Public can read user profiles" ON users;
  DROP POLICY IF EXISTS "users_insert_own" ON users;
  DROP POLICY IF EXISTS "users_public_read" ON users;
  DROP POLICY IF EXISTS "users_update_own" ON users;
  DROP POLICY IF EXISTS "users_insert_own_profile" ON users;
  DROP POLICY IF EXISTS "users_public_read_profile" ON users;
  DROP POLICY IF EXISTS "users_update_own_profile" ON users;
END $$;

-- Create new, clean set of policies
CREATE POLICY "allow_insert_own_profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_read_own_profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_update_own_profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_public_read_profiles"
ON users
FOR SELECT
TO public
USING (true);

-- Make sure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;