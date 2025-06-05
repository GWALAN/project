/*
  # Update get_admin_stats function to use get_dashboard_analytics

  1. Changes
    - Replace get_admin_stats implementation to use get_dashboard_analytics
    - Grant execute permission to authenticated users
*/

-- Update get_admin_stats function
CREATE OR REPLACE FUNCTION public.get_admin_stats(
  creator_id uuid,
  date_range text DEFAULT '30d'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.get_dashboard_analytics(
    owner_uid  := creator_id,
    date_range := date_range
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_admin_stats(uuid,text)
  TO authenticated;