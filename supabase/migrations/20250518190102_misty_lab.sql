-- Drop existing admin-related policies
DROP POLICY IF EXISTS "admin_full_access" ON users;

-- Create new admin policy using JWT claims
CREATE POLICY "admin_full_access"
ON users FOR ALL 
TO authenticated
USING (
  -- Check admin status from JWT claims
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') IN (
    SELECT email FROM users WHERE isadmin = true
  )
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') IN (
    SELECT email FROM users WHERE isadmin = true
  )
);

-- Update your user to be an admin (replace with your email)
UPDATE users 
SET isadmin = true 
WHERE email = current_setting('request.jwt.claims', true)::jsonb ->> 'email';

-- Modify get_admin_stats function to use JWT claims
CREATE OR REPLACE FUNCTION get_admin_stats(
  creator_id uuid,
  date_range text DEFAULT '30d'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats json;
  start_date timestamptz;
  user_email text;
BEGIN
  -- Get user email from JWT claims
  user_email := current_setting('request.jwt.claims', true)::jsonb ->> 'email';
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE email = user_email 
    AND isadmin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  -- Calculate start date based on range
  start_date := CASE date_range
    WHEN '7d' THEN now() - interval '7 days'
    WHEN '30d' THEN now() - interval '30 days'
    WHEN '90d' THEN now() - interval '90 days'
    ELSE now() - interval '30 days'
  END;

  -- Rest of the function remains the same
  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM users u WHERE u.id = creator_id),
    'totalProducts', (
      SELECT COUNT(*) 
      FROM products p
      WHERE p.creatorid = creator_id
    ),
    'totalOrders', (
      SELECT COUNT(*) 
      FROM orders o
      JOIN products p ON o.productid = p.id
      WHERE p.creatorid = creator_id
      AND o.createdat >= start_date
    ),
    'totalRevenue', (
      SELECT COALESCE(SUM(p.price), 0)
      FROM orders o
      JOIN products p ON o.productid = p.id
      WHERE p.creatorid = creator_id
      AND o.status = 'paid'
      AND o.createdat >= start_date
    ),
    'platformFees', (
      SELECT COALESCE(SUM(
        CASE 
          WHEN p.contenttype = 'digital_product' THEN p.price * 0.1
          WHEN p.contenttype = 'video' THEN p.price * 0.1
          WHEN p.contenttype = 'nsfw' THEN p.price * 0.18
          WHEN p.contenttype = 'coaching' THEN p.price * 0.1
          WHEN p.contenttype = 'membership' THEN p.price * 0.05
          WHEN p.contenttype = 'writing' THEN p.price * 0.05
          ELSE p.price * 0.1
        END
      ), 0)
      FROM orders o
      JOIN products p ON o.productid = p.id
      WHERE p.creatorid = creator_id
      AND o.status = 'paid'
      AND o.createdat >= start_date
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;