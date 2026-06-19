CREATE OR REPLACE FUNCTION deduct_meal_balance(p_user_id uuid, p_amount numeric)
RETURNS void AS $$
BEGIN
  -- Insert or update user_balances
  INSERT INTO user_balances (user_id, balance, total_consumed)
  VALUES (p_user_id, -p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = user_balances.balance - p_amount,
        total_consumed = user_balances.total_consumed + p_amount,
        updated_at = NOW();
  -- Record transaction
  INSERT INTO advance_payments (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'meal_charge', 'Meal order deduction');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_user_balance(p_user_id uuid, p_amount numeric, p_admin_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO user_balances (user_id, balance, total_deposits)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = user_balances.balance + p_amount,
        total_deposits = user_balances.total_deposits + p_amount,
        updated_at = NOW();
  INSERT INTO advance_payments (user_id, amount, type, description, created_by)
  VALUES (p_user_id, p_amount, 'deposit', 'Admin deposit', p_admin_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS cash_payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  notes text,
  created_at timestamptz DEFAULT NOW(),
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES profiles(id)
);

ALTER TABLE cash_payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own requests" ON cash_payment_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own requests" ON cash_payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all requests" ON cash_payment_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
