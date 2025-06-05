-- Create monthly earnings table
CREATE TABLE IF NOT EXISTS monthly_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid REFERENCES users(id) ON DELETE CASCADE,
  month date NOT NULL, -- Store as first day of month
  amount bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (userid, month)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_monthly_earnings_user_month 
ON monthly_earnings(userid, month);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthly_earnings_updated_at
  BEFORE UPDATE ON monthly_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate platform fee based on monthly earnings
CREATE OR REPLACE FUNCTION calculate_platform_fee(
  creator_id uuid,
  amount integer,
  content_type text
)
RETURNS integer AS $$
DECLARE
  current_month date;
  monthly_total bigint;
  threshold bigint := 50000; -- $500 in cents
  base_rate decimal;
  pro_rate decimal := 0.03; -- 3% for pro plan
BEGIN
  -- Get current month (first day)
  current_month := date_trunc('month', current_date)::date;
  
  -- Get total earnings this month
  SELECT COALESCE(amount, 0) INTO monthly_total
  FROM monthly_earnings
  WHERE userid = creator_id AND month = current_month;

  -- Determine base rate by content type
  base_rate := CASE content_type
    WHEN 'digital_product' THEN 0.10 -- 10%
    WHEN 'video' THEN 0.10 -- 10%
    WHEN 'nsfw' THEN 0.18 -- 18%
    WHEN 'coaching' THEN 0.10 -- 10%
    WHEN 'membership' THEN 0.05 -- 5%
    WHEN 'writing' THEN 0.05 -- 5%
    ELSE 0.10 -- Default 10%
  END;

  -- If under threshold, use base rate
  IF monthly_total < threshold THEN
    RETURN floor(amount * base_rate);
  END IF;

  -- If over threshold, use pro rate
  RETURN floor(amount * pro_rate);
END;
$$ LANGUAGE plpgsql;

-- Function to update monthly earnings
CREATE OR REPLACE FUNCTION update_monthly_earnings()
RETURNS TRIGGER AS $$
DECLARE
  creator_id uuid;
  current_month date;
BEGIN
  -- Get creator ID from products table
  SELECT creatorid INTO creator_id
  FROM products
  WHERE id = NEW.productid;

  -- Get current month (first day)
  current_month := date_trunc('month', current_date)::date;

  -- Update or insert monthly earnings
  INSERT INTO monthly_earnings (userid, month, amount)
  VALUES (creator_id, current_month, NEW.amount)
  ON CONFLICT (userid, month)
  DO UPDATE SET amount = monthly_earnings.amount + NEW.amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update monthly earnings when order is paid
CREATE TRIGGER update_monthly_earnings_on_order
  AFTER INSERT OR UPDATE OF status
  ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION update_monthly_earnings();

-- Add RLS policies
ALTER TABLE monthly_earnings ENABLE ROW LEVEL SECURITY;

-- Creators can view their own earnings
CREATE POLICY "Users can view their own earnings"
ON monthly_earnings
FOR SELECT
TO authenticated
USING (auth.uid() = userid);

-- Only the system can insert/update earnings
CREATE POLICY "System can manage earnings"
ON monthly_earnings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);