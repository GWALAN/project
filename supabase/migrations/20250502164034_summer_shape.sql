-- Add status column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE orders ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- Create index on orders status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create index on orders buyeremail
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyeremail);

-- Create index on orders createdat
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(createdat);

-- Add RLS policy for buyers to view their own orders
CREATE POLICY "Buyers can view their own orders"
ON orders FOR SELECT
TO public
USING (buyeremail = current_user);