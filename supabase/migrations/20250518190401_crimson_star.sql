-- Create function to handle account deletion cleanup
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete user's storage files
  DELETE FROM storage.objects
  WHERE bucket_id IN ('profile-images', 'product-files', 'product-images')
  AND (storage.foldername(name))[1] = OLD.id::text;

  -- Delete user's products
  DELETE FROM products WHERE creatorid = OLD.id;

  -- Delete user's profile
  DELETE FROM profiles WHERE userid = OLD.id;

  -- Delete user's subscriptions
  DELETE FROM subscriptions WHERE buyerid = OLD.id;

  -- Delete user's messages
  DELETE FROM messages WHERE senderid = OLD.id OR recipientid = OLD.id;

  -- Delete user's orders
  DELETE FROM orders WHERE buyeremail = OLD.email;

  RETURN OLD;
END;
$$;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS on_user_deleted ON auth.users;
CREATE TRIGGER on_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Add policy for user deletion
CREATE POLICY "Users can delete their own account"
ON auth.users
FOR DELETE
TO authenticated
USING (auth.uid() = id);