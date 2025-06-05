/*
  # Fix admin access and analytics function

  1. Changes
    - Fix admin role check in get_admin_stats function
    - Update admin access policies
    - Add proper error handling
*/

-- Drop existing admin-related policies
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;

-- Create new admin policy
CREATE POLICY "admin_access"
ON users
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.isadmin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.isadmin = true
  )
);

-- Update get_admin_stats function with proper error handling
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
  is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT isadmin INTO is_admin
  FROM users
  WHERE id = auth.uid();

  IF is_admin IS NULL OR NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  -- Calculate start date based on range
  start_date := CASE date_range
    WHEN '7d' THEN now() - interval '7 days'
    WHEN '30d' THEN now() - interval '30 days'
    WHEN '90d' THEN now() - interval '90 days'
    ELSE now() - interval '30 days'
  END;

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
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error getting admin stats: %', SQLERRM;
END;
$$;