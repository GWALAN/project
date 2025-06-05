/*
  # Create messages table for buyer-seller communication

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `orderid` (uuid, references orders)
      - `senderid` (uuid, references users)
      - `recipientid` (uuid, references users)
      - `content` (text)
      - `read` (boolean)
      - `createdat` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for:
      - Reading messages (sender/recipient only)
      - Sending messages (with order validation)
      - Updating read status
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orderid uuid REFERENCES orders(id) ON DELETE CASCADE,
  senderid uuid REFERENCES users(id) ON DELETE CASCADE,
  recipientid uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  createdat timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_orderid ON messages(orderid);
CREATE INDEX IF NOT EXISTS idx_messages_senderid ON messages(senderid);
CREATE INDEX IF NOT EXISTS idx_messages_recipientid ON messages(recipientid);
CREATE INDEX IF NOT EXISTS idx_messages_createdat ON messages(createdat);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read messages they sent or received"
ON messages FOR SELECT
TO authenticated
USING (
  auth.uid() = senderid OR 
  auth.uid() = recipientid
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = senderid AND
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = orderid AND (
      -- Buyer can message if they have a valid order
      (o.buyeremail = auth.email()) OR
      -- Creator can message if they own the product
      EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = o.productid AND p.creatorid = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can mark messages as read"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = recipientid)
WITH CHECK (
  auth.uid() = recipientid AND
  (read IS TRUE AND read IS DISTINCT FROM messages.read)
);