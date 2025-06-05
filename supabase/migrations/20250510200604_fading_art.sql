-- Rename isadultcontent to ismaturecontent
ALTER TABLE products RENAME COLUMN isadultcontent TO ismaturecontent;

-- Update index name
DROP INDEX IF EXISTS idx_products_adult_content;
CREATE INDEX idx_products_mature_content ON products(ismaturecontent);

-- Update RLS policies
DROP POLICY IF EXISTS "Public can read non-hidden products" ON products;
CREATE POLICY "Public can read non-hidden products"
ON products
FOR SELECT
TO public
USING (
  NOT hidden AND
  (NOT ismaturecontent OR ismaturecontent IS NULL)
);