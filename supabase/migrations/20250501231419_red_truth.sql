/*
  # Add blurPreview column to products table

  1. Changes
    - Add `blurPreview` boolean column to products table with default value of false
    - Fix column casing to match Supabase conventions
*/

DO $$ 
BEGIN
  -- Add blurPreview column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'blurpreview'
  ) THEN
    ALTER TABLE products ADD COLUMN blurpreview boolean DEFAULT false;
  END IF;

  -- Fix column casing
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'creatorId'
  ) THEN
    ALTER TABLE products RENAME COLUMN "creatorId" TO creatorid;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE products RENAME COLUMN "createdAt" TO createdat;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'userId'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN "userId" TO userid;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE orders RENAME COLUMN "createdAt" TO createdat;
  END IF;
END $$;