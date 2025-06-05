DO $$ 
BEGIN
  -- Add Stripe account ID column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'stripeaccountid'
  ) THEN
    ALTER TABLE users ADD COLUMN stripeaccountid text;
  END IF;

  -- Add Stripe account status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'stripeaccountstatus'
  ) THEN
    ALTER TABLE users ADD COLUMN stripeaccountstatus text;
  END IF;

  -- Create index on stripeAccountId if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'users'
    AND indexname = 'idx_users_stripe_account_id'
  ) THEN
    CREATE INDEX idx_users_stripe_account_id ON users(stripeaccountid);
  END IF;
END $$;