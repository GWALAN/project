/*
  # Secure Storage Access
  
  1. Changes
    - Make product-files bucket private
    - Add secure download policies
    - Add purchase verification
    - Add file type validation
  
  2. Security
    - Prevent unauthorized downloads
    - Validate file ownership
    - Enforce file type restrictions
*/

-- Make product-files bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'product-files';

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public to view product files" ON storage.objects;
DROP POLICY IF EXISTS "Allow creators to upload product files" ON storage.objects;
DROP POLICY IF EXISTS "Allow buyers to download purchased files" ON storage.objects;

-- Create secure download policy for product files
CREATE POLICY "verify_purchase_for_download"
ON storage.objects
FOR SELECT
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

-- Create secure upload policy for creators
CREATE POLICY "secure_creator_uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM products p
    WHERE 
      p.creatorid = auth.uid() AND
      p.fileurl LIKE '%' || name
  )
);

-- Create secure update policy for creators
CREATE POLICY "secure_creator_updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM products p
    WHERE 
      p.creatorid = auth.uid() AND
      p.fileurl LIKE '%' || name
  )
)
WITH CHECK (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM products p
    WHERE 
      p.creatorid = auth.uid() AND
      p.fileurl LIKE '%' || name
  )
);

-- Create secure delete policy for creators
CREATE POLICY "secure_creator_deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM products p
    WHERE 
      p.creatorid = auth.uid() AND
      p.fileurl LIKE '%' || name
  )
);

-- Add file type validation function
CREATE OR REPLACE FUNCTION validate_file_type(
  file_name text,
  content_type text
) RETURNS boolean AS $$
DECLARE
  ext text;
BEGIN
  ext := lower(substring(file_name from '\.([^\.]+)$'));
  
  CASE content_type
    WHEN 'video' THEN
      RETURN ext = ANY(ARRAY['mp4', 'mov', 'webm']);
    WHEN 'audio' THEN
      RETURN ext = ANY(ARRAY['mp3', 'wav', 'ogg']);
    WHEN 'digital_product' THEN
      RETURN ext = ANY(ARRAY['pdf', 'zip', 'epub']);
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Add file type validation to upload policies
ALTER POLICY "secure_creator_uploads"
ON storage.objects
WITH CHECK (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM products p
    WHERE 
      p.creatorid = auth.uid() AND
      p.fileurl LIKE '%' || name AND
      validate_file_type(name, p.contenttype)
  )
);