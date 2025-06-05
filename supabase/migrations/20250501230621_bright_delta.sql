/*
  # Fix column casing in database schema

  1. Changes
    - Normalize column names to use lowercase
    - Add safety checks to prevent errors if columns don't exist
    - Handle both possible cases (camelCase and lowercase)

  2. Tables Modified
    - products
    - profiles
    - orders
*/

DO $$ 
BEGIN
  -- Fix column names in products table
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

  -- Fix column names in profiles table
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'userId'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN "userId" TO userid;
  END IF;

  -- Fix column names in orders table
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE orders RENAME COLUMN "createdAt" TO createdat;
  END IF;
END $$;