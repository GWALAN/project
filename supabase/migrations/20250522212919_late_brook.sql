-- Create a function to delete all users from the public.users table
CREATE OR REPLACE FUNCTION delete_all_public_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all users from public.users table
  DELETE FROM public.users;
END;
$$;

-- Grant execute permission to the service_role
GRANT EXECUTE ON FUNCTION delete_all_public_users() TO service_role;