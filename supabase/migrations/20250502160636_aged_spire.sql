DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'externallinks'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN externallinks JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;