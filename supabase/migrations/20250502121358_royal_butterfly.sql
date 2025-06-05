/*
  # Fix blurPreview column type

  1. Changes
    - Drop existing blurpreview column if it exists
    - Create new blurpreview column as boolean with default false
*/

DO $$ 
BEGIN
  -- Drop the existing column if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'blurpreview'
  ) THEN
    ALTER TABLE products DROP COLUMN blurpreview;
  END IF;

  -- Create the column as boolean
  ALTER TABLE products ADD COLUMN blurpreview boolean DEFAULT false;
END $$;