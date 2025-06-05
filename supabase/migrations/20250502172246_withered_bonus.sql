-- Add identity verification columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS identityverified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS identityverifiedat timestamptz;

-- Create index for identity verification status
CREATE INDEX IF NOT EXISTS idx_users_identity_verified ON users(identityverified);