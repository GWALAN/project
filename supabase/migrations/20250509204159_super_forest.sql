-- Add plan type to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free';

-- Create storage usage tracking table
CREATE TABLE IF NOT EXISTS storage_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid REFERENCES users(id) ON DELETE CASCADE,
  bucket_id text NOT NULL,
  total_size bigint DEFAULT 0,
  file_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(userid, bucket_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_storage_usage_user 
ON storage_usage(userid);

-- Function to validate file type based on content category
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

-- Function to validate file upload based on plan limits
CREATE OR REPLACE FUNCTION validate_storage_limits(
  in_userid uuid,
  in_bucket_id text,
  in_file_size bigint
) RETURNS boolean AS $$
DECLARE
  user_plan text;
  current_usage record;
  size_limit bigint;
  file_count_limit integer;
BEGIN
  -- Get user's plan
  SELECT plan_type INTO user_plan
  FROM users
  WHERE id = in_userid;

  -- Get current storage usage
  SELECT * INTO current_usage
  FROM storage_usage
  WHERE userid = in_userid AND bucket_id = in_bucket_id;

  -- Set limits based on plan
  IF user_plan = 'free' THEN
    -- Free plan limits
    IF in_bucket_id = 'product-files' THEN
      size_limit := 2 * 1024 * 1024 * 1024; -- 2GB total
      file_count_limit := 5; -- 5 products
    END IF;
  ELSE
    -- Pro plan limits
    IF in_bucket_id = 'product-files' THEN
      size_limit := 50 * 1024 * 1024 * 1024; -- 50GB total
      file_count_limit := NULL; -- Unlimited files
    END IF;
  END IF;

  -- Check total storage limit
  IF current_usage.total_size + in_file_size > size_limit THEN
    RETURN false;
  END IF;

  -- Check file count limit for free plan
  IF file_count_limit IS NOT NULL AND current_usage.file_count >= file_count_limit THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO storage_usage (userid, bucket_id, total_size, file_count)
    VALUES (
      auth.uid(),
      TG_ARGV[0],
      COALESCE((current_setting('request.jwt.claims')::jsonb)->>'size', '0')::bigint,
      1
    )
    ON CONFLICT (userid, bucket_id)
    DO UPDATE SET
      total_size = storage_usage.total_size + EXCLUDED.total_size,
      file_count = storage_usage.file_count + 1,
      updated_at = now();
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE storage_usage
    SET 
      total_size = GREATEST(0, total_size - COALESCE((current_setting('request.jwt.claims')::jsonb)->>'size', '0')::bigint),
      file_count = GREATEST(0, file_count - 1),
      updated_at = now()
    WHERE 
      userid = auth.uid()
      AND bucket_id = TG_ARGV[0];
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for storage usage tracking
DROP TRIGGER IF EXISTS track_product_files_insert ON storage.objects;
DROP TRIGGER IF EXISTS track_product_files_delete ON storage.objects;

-- Separate triggers for INSERT and DELETE
CREATE TRIGGER track_product_files_insert
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'product-files')
  EXECUTE FUNCTION update_storage_usage('product-files');

CREATE TRIGGER track_product_files_delete
  AFTER DELETE ON storage.objects
  FOR EACH ROW
  WHEN (OLD.bucket_id = 'product-files')
  EXECUTE FUNCTION update_storage_usage('product-files');

-- Add RLS policies
ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own storage usage
CREATE POLICY "Users can view their storage usage"
ON storage_usage
FOR SELECT
TO authenticated
USING (userid = auth.uid());

-- Only the system can update storage usage
CREATE POLICY "System can manage storage usage"
ON storage_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Storage policies for product files
CREATE POLICY "storage_objects_product_files_secure_download"
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

CREATE POLICY "storage_objects_product_files_secure_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-files' AND
  validate_storage_limits(auth.uid(), bucket_id, (NULLIF(current_setting('request.jwt.claims')::jsonb->>'size', '')::bigint)) AND
  EXISTS (
    SELECT 1 FROM products p
    WHERE 
      p.creatorid = auth.uid() AND
      p.fileurl LIKE '%' || name AND
      validate_file_type(name, p.contenttype)
  )
);