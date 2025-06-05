/*
  # Add Pro subscription functionality

  1. New Tables
    - `pro_subscriptions`
      - `id` (uuid, primary key)
      - `userid` (uuid, references users)
      - `active` (boolean)
      - `createdat` (timestamp)
      - `paypalsubscriptionid` (text)
      - `nextbillingdate` (timestamp)
      - `cancelledat` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for subscription management
*/

-- Create pro_subscriptions table
CREATE TABLE IF NOT EXISTS pro_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  createdat timestamptz DEFAULT now(),
  paypalsubscriptionid text,
  nextbillingdate timestamptz,
  cancelledat timestamptz,
  UNIQUE (userid)
);

-- Enable RLS
ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription"
ON pro_subscriptions FOR SELECT
TO authenticated
USING (userid = auth.uid());

CREATE POLICY "System can manage subscriptions"
ON pro_subscriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add pro_plan column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_user ON pro_subscriptions(userid);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_active ON pro_subscriptions(active);