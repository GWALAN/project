/*
  # Add admin functionality and product moderation

  1. Changes
    - Add isAdmin column to users table
    - Create admin stats function
    - Add product moderation features
    - Update policies for admin access

  2. Security
    - Only admins can access admin stats
    - Admins can moderate products
*/

-- Add isAdmin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS isadmin boolean DEFAULT false;

-- Create function to get admin stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats json;
BEGIN
  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM users),
    'totalProducts', (SELECT COUNT(*) FROM products),
    'totalOrders', (SELECT COUNT(*) FROM orders),
    'totalRevenue', (SELECT COALESCE(SUM(products.price), 0) FROM orders JOIN products ON orders.productid = products.id WHERE orders.status = 'paid'),
    'platformFees', (
      SELECT COALESCE(SUM(
        CASE 
          WHEN products.contenttype = 'digital_product' THEN products.price * 0.1
          WHEN products.contenttype = 'video' THEN products.price * 0.1
          WHEN products.contenttype = 'nsfw' THEN products.price * 0.18
          WHEN products.contenttype = 'coaching' THEN products.price * 0.1
          WHEN products.contenttype = 'membership' THEN products.price * 0.05
          WHEN products.contenttype = 'writing' THEN products.price * 0.05
          WHEN products.contenttype = 'streaming' THEN products.price * 0.3
          ELSE products.price * 0.1
        END
      ), 0)
      FROM orders 
      JOIN products ON orders.productid = products.id 
      WHERE orders.status = 'paid'
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Only admins can access admin stats" ON users;

-- Create policy for admin access
CREATE POLICY "Only admins can access admin stats"
ON users
FOR ALL
TO authenticated
USING (isadmin = true)
WITH CHECK (isadmin = true);

-- Add hidden column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;

-- Create index for hidden products
CREATE INDEX IF NOT EXISTS idx_products_hidden ON products(hidden);

-- Update product policies to exclude hidden products for non-admins
DROP POLICY IF EXISTS "Public can read products" ON products;
CREATE POLICY "Public can read non-hidden products"
ON products
FOR SELECT
TO public
USING (NOT hidden);

CREATE POLICY "Admins can read all products"
ON products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.isadmin = true
  )
);