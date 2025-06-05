-- Create get_dashboard_analytics function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(
  owner_uid uuid,
  date_range text DEFAULT '30d'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats jsonb;
  start_date timestamptz;
BEGIN
  -- Calculate start date based on range
  start_date := CASE date_range
    WHEN '7d' THEN now() - interval '7 days'
    WHEN '30d' THEN now() - interval '30 days'
    WHEN '90d' THEN now() - interval '90 days'
    ELSE now() - interval '30 days'
  END;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT COUNT(*) FROM users u WHERE u.id = owner_uid),
    'totalProducts', (
      SELECT COUNT(*) 
      FROM products p
      WHERE p.creatorid = owner_uid
    ),
    'totalOrders', (
      SELECT COUNT(*) 
      FROM orders o
      JOIN products p ON o.productid = p.id
      WHERE p.creatorid = owner_uid
      AND o.createdat >= start_date
    ),
    'totalRevenue', (
      SELECT COALESCE(SUM(p.price), 0)
      FROM orders o
      JOIN products p ON o.productid = p.id
      WHERE p.creatorid = owner_uid
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
      WHERE p.creatorid = owner_uid
      AND o.status = 'paid'
      AND o.createdat >= start_date
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Create get_admin_stats function that calls get_dashboard_analytics
CREATE OR REPLACE FUNCTION public.get_admin_stats(
  creator_id uuid,
  date_range text DEFAULT '30d'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_dashboard_analytics(
    owner_uid  := creator_id,
    date_range := date_range
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_stats(uuid,text)
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_dashboard_analytics(uuid,text)
  TO authenticated;