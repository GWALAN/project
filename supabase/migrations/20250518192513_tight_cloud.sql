-- Drop existing admin policies
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;

-- Create simplified admin policy
CREATE POLICY "admin_access"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND isadmin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND isadmin = true
  )
);

-- Update get_admin_stats function
CREATE OR REPLACE FUNCTION get_admin_stats(
  creator_id uuid,
  date_range text DEFAULT '30d'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND isadmin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  RETURN json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM users WHERE id = creator_id),
    'totalProducts', (SELECT COUNT(*) FROM products WHERE creatorid = creator_id),
    'totalOrders', (SELECT COUNT(*) FROM orders WHERE buyeremail = (SELECT email FROM users WHERE id = creator_id)),
    'totalRevenue', 0,
    'platformFees', 0
  );
END;
$$;