/*
  # Add content type validation and file metadata

  1. Changes
    - Create content_type enum
    - Add file validation function
    - Add file metadata columns to products table
    - Update storage policies with validation

  2. Security
    - Validate file types based on content category
    - Track file metadata for auditing
*/

-- Create content type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
    CREATE TYPE content_type AS ENUM (
      'digital_product',
      'video',
      'nsfw',
      'coaching',
      'membership',
      'writing',
      'streaming'
    );
  END IF;
END $$;

-- Add file validation function
CREATE OR REPLACE FUNCTION validate_file_type(
  bucket_name text,
  file_path text,
  product_id uuid
) RETURNS boolean AS $$
DECLARE
  file_ext text;
  product_type text;
BEGIN
  -- Extract file extension
  file_ext := LOWER(SUBSTRING(file_path FROM '\.([^\.]+)$'));
  
  -- Get product content type
  SELECT contenttype INTO product_type
  FROM products 
  WHERE id = product_id;
  
  -- Validate based on bucket and content type
  CASE bucket_name
    WHEN 'product-images' THEN
      RETURN file_ext = ANY(ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp']);
      
    WHEN 'product-files' THEN
      CASE product_type
        WHEN 'digital_product' THEN
          RETURN file_ext = ANY(ARRAY['pdf', 'zip', 'epub']);
        WHEN 'video' THEN
          RETURN file_ext = ANY(ARRAY['mp4', 'mov', 'webm']);
        WHEN 'audio' THEN
          RETURN file_ext = ANY(ARRAY['mp3', 'wav', 'm4a']);
        ELSE
          RETURN TRUE;
      END CASE;
  END CASE;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add file metadata columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'filetype') THEN
    ALTER TABLE products ADD COLUMN filetype text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'filesize') THEN
    ALTER TABLE products ADD COLUMN filesize bigint;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'filemetadata') THEN
    ALTER TABLE products ADD COLUMN filemetadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update storage policy for file validation
CREATE POLICY "validate_product_file_uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('product-files', 'product-images') AND
  validate_file_type(
    bucket_id,
    name,
    (regexp_match(name, '^([^/]+)'))[1]::uuid
  )
);