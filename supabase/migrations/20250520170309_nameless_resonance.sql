-- Create profile-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing profile image policies to avoid conflicts
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
    AND (
      policyname LIKE '%profile%' OR
      policyname LIKE '%profile_images%'
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if no policies exist
END $$;

-- Create maximally permissive policies for profile-images bucket

-- Allow public to read profile images
CREATE POLICY "profile_images_select_20250521_fix"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Allow authenticated users to upload profile images
CREATE POLICY "profile_images_insert_20250521_fix"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to update profile images
CREATE POLICY "profile_images_update_20250521_fix"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to delete profile images
CREATE POLICY "profile_images_delete_20250521_fix"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- Update users table to ensure profileImage column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'profileimage'
  ) THEN
    ALTER TABLE users ADD COLUMN profileimage text;
  END IF;
END $$;