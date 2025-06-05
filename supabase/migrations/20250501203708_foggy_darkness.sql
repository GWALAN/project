/*
  # Fix RLS policies and schema issues

  1. Schema Changes
    - Rename column 'displayname' to 'displayName' in users table
    - Add missing RLS policies for user creation and storage

  2. Storage
    - Create storage bucket for profile images
    - Add storage bucket policies

  3. Security
    - Add RLS policies for user creation
    - Add storage policies for profile image uploads
*/

-- Update column name to match application code
ALTER TABLE users RENAME COLUMN displayname TO "displayName";

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-images', 'profile-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Add storage bucket policy for authenticated uploads
CREATE POLICY "Allow authenticated uploads to profile-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = 'profile-images'
);

-- Add storage bucket policy for public downloads
CREATE POLICY "Allow public downloads from profile-images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-images');

-- Add policy for users to create their own profile
CREATE POLICY "Users can create their own profile"
ON users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Add policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);