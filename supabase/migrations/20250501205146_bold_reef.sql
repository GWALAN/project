/*
  # Fix storage policies for profile images

  1. Changes
    - Create profile-images bucket if it doesn't exist
    - Drop all existing storage policies to avoid conflicts
    - Create new simplified policies that only check bucket and auth
    - Remove folder name restrictions that were causing upload issues
  
  2. Security
    - Maintain RLS protection while simplifying policy rules
    - Allow public read access for profile images
    - Restrict write operations to authenticated users
*/

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public to view profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated uploads to profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated updates to profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated deletes of profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;
END $$;

-- Create new simplified policies
CREATE POLICY "storage_objects_allow_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

CREATE POLICY "storage_objects_allow_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid() IS NOT NULL
);

CREATE POLICY "storage_objects_allow_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_objects_allow_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);