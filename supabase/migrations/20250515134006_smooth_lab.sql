-- Add subscription support to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pricing_mode text DEFAULT 'one_time',
ADD COLUMN IF NOT EXISTS subscription_tier_id uuid REFERENCES subscription_tiers(id);