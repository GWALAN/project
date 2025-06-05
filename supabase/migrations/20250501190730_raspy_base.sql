/*
  # Create initial schema for LinkNest

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `username` (text, unique)
      - `displayName` (text)
      - `bio` (text)
      - `profileImage` (text)
      - `stripeAccountId` (text)
      - `createdAt` (timestamp)
    - `products`
      - `id` (uuid, primary key)
      - `creatorId` (uuid, foreign key to users)
      - `title` (text)
      - `description` (text)
      - `price` (integer, in cents)
      - `contentType` (text)
      - `fileUrl` (text)
      - `previewImageUrl` (text)
      - `blurPreview` (boolean)
      - `createdAt` (timestamp)
    - `orders`
      - `id` (uuid, primary key)
      - `productId` (uuid, foreign key to products)
      - `buyerEmail` (text)
      - `status` (text)
      - `payoutStatus` (text)
      - `stripePaymentIntentId` (text)
      - `createdAt` (timestamp)
    - `profiles`
      - `userId` (uuid, primary key, foreign key to users)
      - `layout` (text)
      - `theme` (text)
      - `externalLinks` (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  displayName text NOT NULL,
  bio text NOT NULL,
  profileImage text,
  stripeAccountId text,
  createdAt timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creatorId uuid REFERENCES users NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  contentType text NOT NULL,
  fileUrl text,
  previewImageUrl text NOT NULL,
  blurPreview boolean DEFAULT false,
  createdAt timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  productId uuid REFERENCES products NOT NULL,
  buyerEmail text NOT NULL,
  status text NOT NULL,
  payoutStatus text NOT NULL,
  stripePaymentIntentId text,
  createdAt timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  userId uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  layout text NOT NULL,
  theme text NOT NULL,
  externalLinks jsonb DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public can read user profiles" ON users
  FOR SELECT
  USING (true);

-- Create policies for products
CREATE POLICY "Creators can CRUD own products" ON products
  FOR ALL
  USING (auth.uid() = creatorId);

CREATE POLICY "Public can read products" ON products
  FOR SELECT
  USING (true);

-- Create policies for orders
CREATE POLICY "Creators can read orders for their products" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = orders.productId
      AND products.creatorId = auth.uid()
    )
  );

CREATE POLICY "Creators can update orders for their products" ON orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = orders.productId
      AND products.creatorId = auth.uid()
    )
  );

CREATE POLICY "Public can create orders" ON orders
  FOR INSERT
  WITH CHECK (true);

-- Create policies for profiles
CREATE POLICY "Users can read/write own profile" ON profiles
  FOR ALL
  USING (auth.uid() = userId);

CREATE POLICY "Public can read profiles" ON profiles
  FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_creatorId ON products(creatorId);
CREATE INDEX IF NOT EXISTS idx_orders_productId ON orders(productId);