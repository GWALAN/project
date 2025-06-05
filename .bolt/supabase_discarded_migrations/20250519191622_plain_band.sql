/*
  # Fix profile images storage policies

  1. Changes
    - Create profile-images bucket if it doesn't exist
    - Add simplified storage policies for profile images
    - Make bucket public for faster image loading
*/

-- Create profile-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Create simple, permissive policies for profile-images bucket
CREATE POLICY "profile_images_select_20250520"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

CREATE POLICY "profile_images_insert_20250520"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "profile_images_update_20250520"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "profile_images_delete_20250520"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');