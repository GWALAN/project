/*
  # Add storage policies for profile images

  1. Changes
    - Create storage bucket for profile images if it doesn't exist
    - Add policies to allow users to:
      - Read their own profile images
      - Upload profile images to their own directory
      - Update their own profile images
      - Delete their own profile images
    
  2. Security
    - Enable row level security on storage bucket
    - Restrict access to only authenticated users
    - Users can only access files in their own directory
    - File paths must start with user ID
*/

-- Create profile-images bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name)
  VALUES ('profile-images', 'profile-images')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile images
CREATE POLICY "Users can read own profile images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to upload profile images
CREATE POLICY "Users can upload own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their profile images
CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their profile images
CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);