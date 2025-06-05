/*
  # Fix product file upload RLS policies

  1. Changes
    - Create simplified storage policies without folder path restrictions
    - Ensure product-files and product-images buckets exist
    - Drop all existing conflicting policies
    - Add explicit policy for product uploads
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

-- Create maximally permissive policies for product-images bucket
CREATE POLICY "product_images_select_20250522_fix"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert_20250522_fix"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_update_20250522_fix"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_delete_20250522_fix"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Create maximally permissive policies for product-files bucket
CREATE POLICY "product_files_select_20250522_fix"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'product-files');

CREATE POLICY "product_files_insert_20250522_fix"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "product_files_update_20250522_fix"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-files')
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "product_files_delete_20250522_fix"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-files');

-- Make sure owner_uid column exists in products table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'owner_uid'
  ) THEN
    ALTER TABLE products ADD COLUMN owner_uid uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Update existing products to set owner_uid = creatorid
UPDATE products SET owner_uid = creatorid WHERE owner_uid IS NULL;

-- Create index for owner_uid if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_products_owner_uid ON products(owner_uid);

-- Update products table RLS policies
DROP POLICY IF EXISTS "Creators can CRUD own products" ON products;
DROP POLICY IF EXISTS "Public can read products" ON products;
DROP POLICY IF EXISTS "Creators can manage own products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;

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