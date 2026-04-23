-- Migration 008: Advance Payments with Balance and Due Adjustments

-- Add advance_payment_enabled setting to app_settings
INSERT INTO app_settings (key, value, description) VALUES
  ('advance_payment_enabled', 'false', 'Enable or disable advance payment feature for users')
ON CONFLICT (key) DO NOTHING;

-- Create user_balances table to track running balance for each user
CREATE TABLE IF NOT EXISTS user_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance numeric(10,2) NOT NULL DEFAULT 0,  -- Positive = credit, Negative = due
  total_deposits numeric(10,2) NOT NULL DEFAULT 0,
  total_consumed numeric(10,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS on user_balances
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Admins can manage all balances
CREATE POLICY "Admins manage user_balances"
  ON user_balances
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance_editor')
    )
  );

-- Users can view their own balance
CREATE POLICY "Users view own balance"
  ON user_balances
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create advance_payments table to track deposits/advance payments
CREATE TABLE IF NOT EXISTS advance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,  -- Amount deposited (positive) or deducted (negative)
  type text NOT NULL CHECK (type IN ('deposit', 'adjustment', 'meal_charge', 'refund')),
  description text,
  month text,  -- Optional: associated month for the transaction
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on advance_payments
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all advance payments
CREATE POLICY "Admins manage advance_payments"
  ON advance_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance_editor')
    )
  );

-- Users can view their own advance payment history
CREATE POLICY "Users view own advance_payments"
  ON advance_payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_balances_user_id_idx ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS advance_payments_user_id_idx ON advance_payments(user_id);
CREATE INDEX IF NOT EXISTS advance_payments_created_at_idx ON advance_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS advance_payments_type_idx ON advance_payments(type);

-- Function to update user balance after advance payment transaction
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance numeric(10,2);
  current_deposits numeric(10,2);
  current_consumed numeric(10,2);
BEGIN
  -- Get or create user balance record
  SELECT balance, total_deposits, total_consumed INTO current_balance, current_deposits, current_consumed
  FROM user_balances WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    current_balance := 0;
    current_deposits := 0;
    current_consumed := 0;
  END IF;

  -- Update based on transaction type
  IF NEW.type = 'deposit' THEN
    current_balance := current_balance + NEW.amount;
    current_deposits := current_deposits + NEW.amount;
  ELSIF NEW.type = 'adjustment' THEN
    current_balance := current_balance + NEW.amount;
  ELSIF NEW.type = 'meal_charge' THEN
    current_balance := current_balance - NEW.amount;
    current_consumed := current_consumed + NEW.amount;
  ELSIF NEW.type = 'refund' THEN
    current_balance := current_balance - NEW.amount;
    current_deposits := current_deposits - NEW.amount;
  END IF;

  -- Insert or update user balance
  INSERT INTO user_balances (user_id, balance, total_deposits, total_consumed, updated_at)
  VALUES (NEW.user_id, current_balance, current_deposits, current_consumed, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = EXCLUDED.balance,
    total_deposits = EXCLUDED.total_deposits,
    total_consumed = EXCLUDED.total_consumed,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update balance
DROP TRIGGER IF EXISTS update_balance_on_advance_payment ON advance_payments;
CREATE TRIGGER update_balance_on_advance_payment
  AFTER INSERT ON advance_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance();
