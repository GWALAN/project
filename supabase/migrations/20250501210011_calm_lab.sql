/*
  # Storage policies for profile images

  1. Changes
    - Creates profile-images bucket if it doesn't exist
    - Drops all existing policies to avoid conflicts
    - Creates new storage policies with proper naming
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
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Public can view profile images');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Users can upload profile images');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Users can update own images');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Users can delete own images');
END $$;

-- Create new policies with unique names
CREATE POLICY "storage_objects_profile_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

CREATE POLICY "storage_objects_profile_images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid() IS NOT NULL
);

CREATE POLICY "storage_objects_profile_images_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_objects_profile_images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);