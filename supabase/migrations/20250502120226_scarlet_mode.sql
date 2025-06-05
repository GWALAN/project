/*
  # Add blurPreview column to products table

  1. Changes
    - Add blurPreview column to products table
    - Use boolean type with default value of false
    - Add safety check to prevent errors if column already exists
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
END $$;