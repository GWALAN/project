-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price integer NOT NULL, -- in cents
  billing_interval text DEFAULT 'monthly',
  createdat timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyerid uuid REFERENCES users(id) ON DELETE CASCADE,
  tierid uuid REFERENCES subscription_tiers(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  startedat timestamptz DEFAULT now(),
  endsat timestamptz,
  paypalsubscriptionid text
);

-- Add pricing mode to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pricing_mode text DEFAULT 'one_time',
ADD COLUMN IF NOT EXISTS subscription_tier_id uuid REFERENCES subscription_tiers(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_userid ON subscription_tiers(userid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_buyerid ON subscriptions(buyerid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tierid ON subscriptions(tierid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_tiers
CREATE POLICY "Creators can manage their tiers"
ON subscription_tiers
FOR ALL
TO authenticated
USING (userid = auth.uid())
WITH CHECK (userid = auth.uid());

CREATE POLICY "Public can view tiers"
ON subscription_tiers
FOR SELECT
TO public
USING (true);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (buyerid = auth.uid());

CREATE POLICY "System can manage subscriptions"
ON subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create view for creator revenue
CREATE OR REPLACE VIEW creator_revenue_summary AS
SELECT 
  u.id AS creator_id,
  u."displayName" AS creator_name,
  -- One-time purchases
  COALESCE(SUM(
    CASE WHEN p.pricing_mode = 'one_time' 
    THEN o.creatorpayout 
    ELSE 0 
    END
  ), 0) AS one_time_revenue,
  -- Subscription revenue
  COALESCE(SUM(
    CASE WHEN p.pricing_mode = 'subscription' 
    THEN st.price - (st.price * 0.1) -- 10% platform fee
    ELSE 0 
    END
  ), 0) AS subscription_revenue,
  -- Active subscribers
  COUNT(DISTINCT 
    CASE WHEN s.status = 'active' 
    THEN s.buyerid 
    END
  ) AS active_subscribers,
  -- Total revenue
  COALESCE(SUM(
    CASE 
      WHEN p.pricing_mode = 'one_time' THEN o.creatorpayout
      WHEN p.pricing_mode = 'subscription' THEN st.price - (st.price * 0.1)
      ELSE 0 
    END
  ), 0) AS total_revenue
FROM users u
LEFT JOIN products p ON p.creatorid = u.id
LEFT JOIN orders o ON o.productid = p.id AND o.status = 'paid'
LEFT JOIN subscription_tiers st ON p.subscription_tier_id = st.id
LEFT JOIN subscriptions s ON s.tierid = st.id
GROUP BY u.id, u."displayName";

-- Function to validate subscription tier price
CREATE OR REPLACE FUNCTION validate_subscription_tier_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price < 100 THEN -- Minimum $1.00
    RAISE EXCEPTION 'Subscription price must be at least $1.00';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription tier price validation
CREATE TRIGGER validate_subscription_tier_price_trigger
  BEFORE INSERT OR UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription_tier_price();