/*
  # Add policy for profile image uploads

  1. Changes
    - Create policy for authenticated users to upload profile images
    - Ensure users can only upload files where they are the owner
    - Maintain proper security while allowing necessary access
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for profile image uploads if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can upload their own profile images'
      AND tablename = 'objects'
      AND schemaname = 'storage'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can upload their own profile images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'profile-images' AND 
        auth.uid() = owner
      );
    $policy$;
  END IF;
END $$;

-- Create policy for updating profile images if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update their own profile images'
      AND tablename = 'objects'
      AND schemaname = 'storage'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update their own profile images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'profile-images' AND 
        auth.uid() = owner
      )
      WITH CHECK (
        bucket_id = 'profile-images' AND 
        auth.uid() = owner
      );
    $policy$;
  END IF;
END $$;

-- Create policy for deleting profile images if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete their own profile images'
      AND tablename = 'objects'
      AND schemaname = 'storage'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can delete their own profile images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'profile-images' AND 
        auth.uid() = owner
      );
    $policy$;
  END IF;
END $$;