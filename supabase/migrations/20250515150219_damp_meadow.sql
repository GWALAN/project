/*
  # Add PayPal plan ID to subscription tiers

  1. Changes
    - Add paypal_plan_id column to subscription_tiers table
    - Add index for faster lookups
*/

-- Add PayPal plan ID column
ALTER TABLE subscription_tiers 
ADD COLUMN IF NOT EXISTS paypal_plan_id text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_paypal_plan_id 
ON subscription_tiers(paypal_plan_id);

-- Update the Pro tier plan ID
UPDATE subscription_tiers 
SET paypal_plan_id = 'P-7AY123456N987654M'
WHERE name = 'Pro';