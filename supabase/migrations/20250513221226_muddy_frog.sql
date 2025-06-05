/*
  # Configure Storage Policies for File Uploads

  1. Storage Buckets
    - product-images: Public bucket for product preview images
    - product-files: Private bucket for downloadable product files

  2. Security
    - Enable RLS on storage buckets
    - Add policies for authenticated uploads
    - Restrict file access based on ownership
*/

-- Create storage buckets if they don't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES 
    ('product-images', 'product-images', true),
    ('product-files', 'product-files', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
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

-- Product Images Policies
CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Product Files Policies
CREATE POLICY "product_files_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "product_files_auth_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM orders o
    JOIN products p ON o.productid = p.id
    WHERE 
      o.status = 'paid' AND
      o.buyeremail = auth.email() AND
      p.fileurl LIKE '%' || name
  )
);

CREATE POLICY "product_files_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-files')
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "product_files_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-files');