/*
  # Fix admin access and analytics function

  1. Changes
    - Add proper admin role check
    - Fix column references
    - Add RLS policies for admin access
    - Update get_admin_stats function
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_admin_stats(uuid, text);

-- Create new function with proper admin check and error handling
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
  current_user_id uuid;
  is_admin boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user exists and is admin
  SELECT u.isadmin INTO is_admin
  FROM users u
  WHERE u.id = current_user_id;

  IF is_admin IS NULL OR NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: User is not an admin' USING ERRCODE = 'P0001';
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
END;
$$;

-- Add RLS policy for admin access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies
DROP POLICY IF EXISTS "Only admins can access admin stats" ON users;
DROP POLICY IF EXISTS "Admins can access all data" ON users;

-- Create new admin policies
CREATE POLICY "Admins can access all data"
ON users
FOR ALL
TO authenticated
USING (
  (SELECT isadmin FROM users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT isadmin FROM users WHERE id = auth.uid())
);