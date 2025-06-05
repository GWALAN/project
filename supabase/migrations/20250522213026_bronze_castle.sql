-- This migration fixes user deletion by removing foreign key constraints
-- and creating a proper cascade delete mechanism

-- First, let's identify and drop any foreign key constraints that might be preventing deletion
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Find all foreign keys referencing auth.users
  FOR r IN (
    SELECT
      tc.constraint_name,
      tc.table_schema,
      tc.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  ) LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I CASCADE', 
                  r.table_schema, r.table_name, r.constraint_name);
  END LOOP;
  
  -- Find all foreign keys referencing public.users
  FOR r IN (
    SELECT
      tc.constraint_name,
      tc.table_schema,
      tc.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'users'
  ) LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I CASCADE', 
                  r.table_schema, r.table_name, r.constraint_name);
  END LOOP;
END $$;

-- Now recreate the foreign key constraints with ON DELETE CASCADE
ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS products_creatorid_fkey,
  ADD CONSTRAINT products_creatorid_fkey
    FOREIGN KEY (creatorid)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.products
  DROP CONSTRAINT IF EXISTS products_owner_uid_fkey,
  ADD CONSTRAINT products_owner_uid_fkey
    FOREIGN KEY (owner_uid)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_userid_fkey,
  ADD CONSTRAINT profiles_userid_fkey
    FOREIGN KEY (userid)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.subscription_tiers
  DROP CONSTRAINT IF EXISTS subscription_tiers_userid_fkey,
  ADD CONSTRAINT subscription_tiers_userid_fkey
    FOREIGN KEY (userid)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.pro_subscriptions
  DROP CONSTRAINT IF EXISTS pro_subscriptions_userid_fkey,
  ADD CONSTRAINT pro_subscriptions_userid_fkey
    FOREIGN KEY (userid)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Create a function to handle user deletion properly
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete from public.users first
  DELETE FROM public.users WHERE id = OLD.id;
  
  -- Delete any storage objects owned by this user
  DELETE FROM storage.objects
  WHERE bucket_id IN ('profile-images', 'product-images', 'product-files')
  AND (storage.foldername(name))[1] = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the function when a user is deleted
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Create a function to delete all users
CREATE OR REPLACE FUNCTION delete_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from public.users first
  DELETE FROM public.users;
  
  -- Then delete from auth.users
  DELETE FROM auth.users;
END;
$$;

-- Grant execute permission to the service_role
GRANT EXECUTE ON FUNCTION delete_all_users() TO service_role;