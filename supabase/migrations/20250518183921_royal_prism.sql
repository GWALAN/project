/*
  # Add analytics function with creator_id parameter

  1. Changes
    - Create get_admin_stats function that accepts creator_id parameter
    - Add date range filtering
    - Calculate revenue and platform fees
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_admin_stats(uuid, text);

-- Create new function with creator_id parameter
CREATE OR REPLACE FUNCTION get_admin_stats(
  creator_id uuid,
  date_range text DEFAULT '30d'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats json;
  start_date timestamptz;
BEGIN
  -- Calculate start date based on range
  start_date := CASE date_range
    WHEN '7d' THEN now() - interval '7 days'
    WHEN '30d' THEN now() - interval '30 days'
    WHEN '90d' THEN now() - interval '90 days'
    ELSE now() - interval '30 days'
  END;

  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM users WHERE id = creator_id),
    'totalProducts', (
      SELECT COUNT(*) 
      FROM products 
      WHERE creatorid = creator_id
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