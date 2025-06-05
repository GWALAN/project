/*
  # Add PayPal payment handling

  1. Changes
    - Add PayPal order ID column to orders table
    - Add platform fee and creator payout columns
    - Add payment status tracking
    - Create function to calculate fees based on content type

  2. Security
    - Maintain existing RLS policies
    - Add validation for payment amounts
*/

-- Add PayPal-specific columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS paypalorderid text,
ADD COLUMN IF NOT EXISTS platformfee bigint,
ADD COLUMN IF NOT EXISTS creatorpayout bigint;

-- Create index for PayPal order ID
CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON orders(paypalorderid);

-- Function to calculate platform fee based on content type
CREATE OR REPLACE FUNCTION calculate_platform_fee(
  content_type text,
  amount bigint
) RETURNS bigint AS $$
BEGIN
  RETURN amount * CASE content_type
    WHEN 'digital_product' THEN 0.10 -- 10%
    WHEN 'video' THEN 0.10          -- 10%
    WHEN 'nsfw' THEN 0.18          -- 18%
    WHEN 'coaching' THEN 0.10      -- 10%
    WHEN 'membership' THEN 0.05    -- 5%
    WHEN 'writing' THEN 0.05       -- 5%
    WHEN 'streaming' THEN 0.30     -- 30%
    ELSE 0.10                      -- Default 10%
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to validate payment amounts
CREATE OR REPLACE FUNCTION validate_payment_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure platform fee is not negative
  IF NEW.platformfee < 0 THEN
    RAISE EXCEPTION 'Platform fee cannot be negative';
  END IF;

  -- Ensure creator payout is not negative
  IF NEW.creatorpayout < 0 THEN
    RAISE EXCEPTION 'Creator payout cannot be negative';
  END IF;

  -- Ensure total amounts match product price
  IF EXISTS (
    SELECT 1 FROM products
    WHERE id = NEW.productid
    AND price != (NEW.platformfee + NEW.creatorpayout)
  ) THEN
    RAISE EXCEPTION 'Payment amounts do not match product price';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment amount validation
CREATE TRIGGER validate_payment_amounts_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION validate_payment_amounts();