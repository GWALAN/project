-- Make product-files bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'product-files';

-- Drop existing policies with dynamic SQL to avoid errors
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

-- Create secure download policy for product files with unique name
CREATE POLICY "storage_objects_product_files_secure_download_20250509"
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

-- Create secure upload policy for creators with unique name
CREATE POLICY "storage_objects_product_files_secure_upload_20250509"
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

-- Create secure update policy for creators with unique name
CREATE POLICY "storage_objects_product_files_secure_update_20250509"
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

-- Create secure delete policy for creators with unique name
CREATE POLICY "storage_objects_product_files_secure_delete_20250509"
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

-- Add file type validation function if it doesn't exist
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

-- Drop and recreate upload policy with file validation
DROP POLICY IF EXISTS "storage_objects_product_files_secure_upload_20250509" ON storage.objects;
CREATE POLICY "storage_objects_product_files_secure_upload_20250509"
ON storage.objects
FOR INSERT
TO authenticated
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