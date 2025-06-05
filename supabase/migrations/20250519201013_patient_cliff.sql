/*
  # Fix RLS policies for products and storage

  1. Changes
    - Update products table policies to handle both creatorid and owner_uid
    - Create proper storage policies for file uploads
    - Fix public read access for product files and images
    
  2. Security
    - Ensure proper user authentication for file uploads
    - Maintain security while allowing necessary access
*/

-- Drop existing policies on products table
DROP POLICY IF EXISTS "Creators can CRUD own products" ON products;
DROP POLICY IF EXISTS "Public can read products" ON products;

-- Create new policies for products table
CREATE POLICY "Creators can manage own products"
ON products
FOR ALL
USING (
  auth.uid() = creatorid OR 
  auth.uid() = owner_uid
)
WITH CHECK (
  auth.uid() = creatorid OR 
  auth.uid() = owner_uid
);

CREATE POLICY "Public can view products"
ON products
FOR SELECT
USING (
  NOT hidden OR 
  auth.uid() = creatorid OR 
  auth.uid() = owner_uid
);

-- Drop existing storage policies to avoid conflicts
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
END $$;

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for product-files bucket
CREATE POLICY "product_files_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "product_files_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-files'
);

CREATE POLICY "product_files_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'product-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "product_files_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policies for product-images bucket
CREATE POLICY "product_images_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'product-images'
);

CREATE POLICY "product_images_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "product_images_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "product_images_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);