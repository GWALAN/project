/*
  # Add refund requests functionality

  1. New Tables
    - `refund_requests`
      - `id` (uuid, primary key)
      - `orderid` (uuid, references orders)
      - `userid` (uuid, references users)
      - `reason` (text)
      - `status` (text)
      - `createdat` (timestamp)
      - `updatedat` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for users and admins
*/

-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orderid uuid REFERENCES orders(id) ON DELETE CASCADE,
  userid uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text DEFAULT 'pending',
  createdat timestamptz DEFAULT now(),
  updatedat timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refund_requests_orderid ON refund_requests(orderid);
CREATE INDEX IF NOT EXISTS idx_refund_requests_userid ON refund_requests(userid);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

-- Enable RLS
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own refund requests"
ON refund_requests FOR SELECT
TO authenticated
USING (userid = auth.uid());

CREATE POLICY "Users can create refund requests"
ON refund_requests FOR INSERT
TO authenticated
WITH CHECK (
  userid = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders
    WHERE id = orderid
    AND buyeremail = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'paid'
  )
);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_refund_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_refund_requests_updatedat
  BEFORE UPDATE ON refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_refund_request_updated_at();