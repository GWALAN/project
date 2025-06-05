/*
  # Implement Refund Request Feature

  1. New Table Structure
    - Ensure refund_requests table exists with proper columns
    - Add necessary indexes for performance
    - Create trigger for automatic timestamp updates

  2. Security
    - Enable RLS on refund_requests table
    - Add policies for users to view and create their own refund requests
    - Ensure proper validation of refund eligibility
*/

-- Create refund_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orderid uuid REFERENCES orders(id) ON DELETE CASCADE,
  userid uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text DEFAULT 'pending',
  createdat timestamptz DEFAULT now(),
  updatedat timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_refund_requests_orderid ON refund_requests(orderid);
CREATE INDEX IF NOT EXISTS idx_refund_requests_userid ON refund_requests(userid);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

-- Enable RLS
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