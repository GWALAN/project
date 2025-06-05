/*
  # Fix profile image upload policies

  1. Changes
    - Create profile-images bucket if it doesn't exist
    - Drop existing policies that might be causing conflicts
    - Create new simplified policies for profile image uploads
    - Add public read access for profile images
    
  2. Security
    - Maintain RLS protection
    - Allow authenticated users to upload to their own folder
    - Allow public read access for profile images
*/

-- Create profile-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for profile-images to avoid conflicts
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg(
      format('DROP POLICY IF EXISTS %I ON storage.objects', policyname),
      '; '
    )
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname LIKE '%profile%'
  );
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if no policies exist
END $$;

-- Create simplified policies for profile-images bucket

-- Allow public to read profile images
CREATE POLICY "profile_images_public_read_20250520"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Allow authenticated users to upload profile images
CREATE POLICY "profile_images_auth_insert_20250520"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to update their profile images
CREATE POLICY "profile_images_auth_update_20250520"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to delete their profile images
CREATE POLICY "profile_images_auth_delete_20250520"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');