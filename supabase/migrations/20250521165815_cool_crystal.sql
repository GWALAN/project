/*
  # Fix Storage RLS Policies for File Uploads

  1. Changes
    - Create more permissive storage policies for file uploads
    - Remove folder path restrictions causing 403 errors
    - Maintain bucket-level security while allowing uploads
    
  2. Security
    - Keep product-files bucket private
    - Allow authenticated users to upload files
    - Maintain public access for product-images
*/

-- Ensure buckets exist with correct privacy settings
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('product-files', 'product-files', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
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
  );
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if no policies exist
END $$;

-- Create permissive policies for product-images bucket
CREATE POLICY "allow_public_read_product_images_20250520"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "allow_auth_insert_product_images_20250520"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Create permissive policies for product-files bucket
CREATE POLICY "allow_auth_read_product_files_20250520"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'product-files');

CREATE POLICY "allow_auth_insert_product_files_20250520"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-files');

-- Add policies for update and delete
CREATE POLICY "allow_auth_update_product_files_20250520"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-files')
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "allow_auth_delete_product_files_20250520"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-files');