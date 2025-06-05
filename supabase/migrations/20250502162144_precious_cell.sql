/*
  # Fix column casing in profiles table

  1. Changes
    - Normalize column names to use lowercase
    - Add safety checks to prevent errors if columns don't exist
*/

DO $$ 
BEGIN
  -- Fix userId to userid
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'userId'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN "userId" TO userid;
  END IF;

  -- Fix externalLinks to externallinks
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'externalLinks'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN "externalLinks" TO externallinks;
  END IF;

  -- Fix themeConfig to themeconfig
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'themeConfig'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN "themeConfig" TO themeconfig;
  END IF;
END $$;