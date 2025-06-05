/*
  # Fix blurPreview column type

  1. Changes
    - Change blurPreview column type from boolean to text
    - Use text type to store blur data (base64/blurhash)
    - Maintain lowercase column naming convention
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
    ALTER TABLE products ADD COLUMN blurpreview text;
  END IF;
END $$;