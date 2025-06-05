/*
  # Create storage buckets for product files

  1. New Storage Buckets
    - `product-images`: For storing product preview images
    - `product-files`: For storing downloadable product files

  2. Security
    - Enable public access for product-images bucket
    - Restrict access to product-files bucket to authenticated users only
*/

-- Create the product-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create the product-files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for product-images bucket
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Set up security policies for product-files bucket
CREATE POLICY "Only authenticated users can access product files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'product-files');

CREATE POLICY "Creators can upload product files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);