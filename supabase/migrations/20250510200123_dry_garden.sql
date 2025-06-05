-- Add isAdultContent column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS isadultcontent boolean DEFAULT false;

-- Create index for adult content filtering
CREATE INDEX IF NOT EXISTS idx_products_adult_content ON products(isadultcontent);

-- Update RLS policies to handle adult content
DROP POLICY IF EXISTS "Public can read non-hidden products" ON products;
CREATE POLICY "Public can read non-hidden products"
ON products
FOR SELECT
TO public
USING (
  NOT hidden AND
  (NOT isadultcontent OR isadultcontent IS NULL)
);