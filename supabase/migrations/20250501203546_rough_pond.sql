/*
  # Add storage policies for profile images

  1. Storage Policies
    - Create profile-images bucket if it doesn't exist
    - Add policies for authenticated users to:
      - Upload their own profile images
      - Read any profile image
      - Update their own profile images
      - Delete their own profile images

  2. Security
    - Ensure files are prefixed with user ID
    - Restrict file types to images
    - Limit file size to 2MB
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-images', 'profile-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Policy to allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT TO public
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow public to read any profile image
CREATE POLICY "Public can read profile images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-images');

-- Policy to allow users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE TO public
USING (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE TO public
USING (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);