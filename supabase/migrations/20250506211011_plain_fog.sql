-- Drop both columns and create a single one
DO $$ 
BEGIN
  -- Drop old columns
  ALTER TABLE profiles DROP COLUMN IF EXISTS sociallinks;
  ALTER TABLE profiles DROP COLUMN IF EXISTS externallinks;

  -- Add new column
  ALTER TABLE profiles ADD COLUMN externallinks jsonb DEFAULT '[]'::jsonb;
END $$;

-- Update any NULL values to empty array
UPDATE profiles 
SET externallinks = '[]'::jsonb 
WHERE externallinks IS NULL;