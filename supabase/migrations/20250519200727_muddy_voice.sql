/*
  # Add Storage Bucket Policies

  1. New Policies
    - Add RLS policies for product-files and product-images buckets
    - Allow authenticated users to upload to their own directory
    - Allow public read access for product files
    
  2. Security
    - Enable RLS on storage buckets
    - Restrict uploads to user's own directory
    - Validate file paths match user ID
*/

-- Enable RLS for storage buckets
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for product files uploads
CREATE POLICY "Users can upload product files to their own directory"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for product files downloads
CREATE POLICY "Anyone can download product files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-files');

-- Policy for product image uploads
CREATE POLICY "Users can upload product images to their own directory"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for product image downloads
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy for updating own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for deleting own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text);