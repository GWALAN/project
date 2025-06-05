/*
  # Add user insert policy

  1. Security Changes
    - Add RLS policy to allow authenticated users to create their own profile
    - This policy ensures users can only create a profile with their own auth.uid()
*/

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Create policy for user profile creation
CREATE POLICY "Users can create their own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);