/*
  # Fix refund request functionality and storage policies

  1. Changes
    - Add proper RLS policies for refund_requests table
    - Fix storage policies for profile images
    - Ensure proper type casting for auth.uid() in storage policies
    
  2. Security
    - Maintain RLS protection
    - Allow users to manage their own refund requests
    - Ensure proper access control for file uploads
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for profile image uploads with proper type casting
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
        (storage.foldername(name))[1] = auth.uid()::text
      );
    $policy$;
  END IF;
END $$;

-- Create policy for updating profile images
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
        (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'profile-images' AND 
        (storage.foldername(name))[1] = auth.uid()::text
      );
    $policy$;
  END IF;
END $$;

-- Create policy for deleting profile images
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
        (storage.foldername(name))[1] = auth.uid()::text
      );
    $policy$;
  END IF;
END $$;

-- Ensure refund_requests table has proper RLS policies
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Users can create refund requests" ON refund_requests;

-- Create policy for viewing refund requests
CREATE POLICY "Users can view their own refund requests"
ON refund_requests FOR SELECT
TO authenticated
USING (userid = auth.uid());

-- Create policy for creating refund requests
CREATE POLICY "Users can create refund requests"
ON refund_requests FOR INSERT
TO authenticated
WITH CHECK (
  userid = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = refund_requests.orderid AND
    orders.buyeremail = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )::text AND
    orders.status = 'paid'
  )
);

-- Create trigger function for updating timestamp
CREATE OR REPLACE FUNCTION update_refund_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_refund_requests_updatedat'
  ) THEN
    CREATE TRIGGER update_refund_requests_updatedat
    BEFORE UPDATE ON refund_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_request_updated_at();
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Trigger might already exist
    NULL;
END $$;