-- Create profile-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing profile image policies to avoid conflicts
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
    AND (
      policyname LIKE '%profile%' OR
      policyname LIKE '%profile_images%'
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if no policies exist
END $$;

-- Create maximally permissive policies for profile-images bucket
CREATE POLICY "profile_images_select_20250523"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

CREATE POLICY "profile_images_insert_20250523"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "profile_images_update_20250523"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "profile_images_delete_20250523"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- Make sure both column versions exist in users table
DO $$ 
BEGIN
  -- Add lowercase version if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'profileimage'
  ) THEN
    ALTER TABLE users ADD COLUMN profileimage text;
  END IF;

  -- Add camelCase version if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'profileImage'
  ) THEN
    ALTER TABLE users ADD COLUMN "profileImage" text;
  END IF;
END $$;

-- Sync the two columns to ensure they have the same data
UPDATE users 
SET profileimage = "profileImage"
WHERE profileimage IS NULL AND "profileImage" IS NOT NULL;

UPDATE users 
SET "profileImage" = profileimage
WHERE "profileImage" IS NULL AND profileimage IS NOT NULL;