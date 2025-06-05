-- Add button_style column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'button_style'
  ) THEN
    ALTER TABLE profiles ADD COLUMN button_style text DEFAULT 'default';
  END IF;
END $$;