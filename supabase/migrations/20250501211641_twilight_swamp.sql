/*
  # Create product storage buckets and policies

  1. Storage Buckets
    - `product-images`: Public bucket for product preview images
    - `product-files`: Private bucket for downloadable product files

  2. Security Policies
    - Public read access for product images
    - Authenticated upload access for both buckets
    - Restricted access for product files
*/

-- Create the product-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create the product-files bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for product-images bucket
CREATE POLICY "Allow public to view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow creators to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow creators to update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow creators to delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Policies for product-files bucket
CREATE POLICY "Allow creators to manage product files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'product-files')
WITH CHECK (bucket_id = 'product-files');

-- Allow buyers to download purchased files
CREATE POLICY "Allow buyers to download purchased files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM orders o
    JOIN products p ON o.productid = p.id
    WHERE o.status = 'paid'
    AND p.fileurl LIKE '%' || name
  )
);