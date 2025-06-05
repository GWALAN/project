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
END $$;

-- Create simplified policies for product-images bucket
CREATE POLICY "product_images_public_read_20250516"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_insert_20250516"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_update_20250516"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_delete_20250516"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Create simplified policies for product-files bucket
CREATE POLICY "product_files_auth_insert_20250516"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "product_files_auth_select_20250516"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'product-files');

CREATE POLICY "product_files_auth_update_20250516"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-files')
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "product_files_auth_delete_20250516"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-files');