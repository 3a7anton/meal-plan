-- Migration 011: Student ordering feature
-- Adds student role, tiffin menu, student orders, and SSLCommerz payment tables.
-- Created: 2026-06-27

-- =====================
-- 1. ADD 'student' TO ROLE CHECK
-- =====================

-- Drop existing constraint and re-add with 'student' included
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Ensure any stale role values are normalised before re-constraining
UPDATE profiles
SET role = 'employee'
WHERE role NOT IN ('employee', 'admin', 'food_editor', 'finance_editor', 'student');

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('employee', 'admin', 'food_editor', 'finance_editor', 'student'));

-- =====================
-- 2. HELPER FUNCTION: is_student
-- =====================

CREATE OR REPLACE FUNCTION public.is_student(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- 3. student_tiffin_menu TABLE
-- =====================

CREATE TABLE IF NOT EXISTS student_tiffin_menu (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id       UUID           NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  scheduled_date DATE          NOT NULL,
  time_slot     TEXT           NOT NULL,
  capacity      INTEGER        NOT NULL DEFAULT 10,
  price         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_available  BOOLEAN        NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

ALTER TABLE student_tiffin_menu ENABLE ROW LEVEL SECURITY;

-- Students can read available menu items
CREATE POLICY "Students can view available tiffin menu"
  ON student_tiffin_menu FOR SELECT
  TO authenticated
  USING (
    is_available = true
    AND public.is_student(auth.uid())
  );

-- Admins (all admin roles) can fully manage the tiffin menu
CREATE POLICY "Admins can manage tiffin menu"
  ON student_tiffin_menu FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tiffin_menu_scheduled_date ON student_tiffin_menu(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tiffin_menu_meal_id        ON student_tiffin_menu(meal_id);
CREATE INDEX IF NOT EXISTS idx_tiffin_menu_is_available   ON student_tiffin_menu(is_available);

-- =====================
-- 4. student_orders TABLE
-- =====================

CREATE TABLE IF NOT EXISTS student_orders (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tiffin_menu_id  UUID           NOT NULL REFERENCES student_tiffin_menu(id) ON DELETE RESTRICT,
  status          TEXT           NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'paid', 'cancelled', 'delivered')),
  quantity        INTEGER        NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_amount    NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  order_date      DATE           NOT NULL DEFAULT CURRENT_DATE,
  meal_date       DATE           NOT NULL,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),

  UNIQUE (student_id, tiffin_menu_id)
);

-- Enforce next-day meal rule: meal_date must be strictly after order_date
ALTER TABLE student_orders ADD CONSTRAINT chk_meal_date_next_day
  CHECK (meal_date > order_date);

ALTER TABLE student_orders ENABLE ROW LEVEL SECURITY;

-- Students: full self-service on their own orders
CREATE POLICY "Students can view own orders"
  ON student_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create own orders"
  ON student_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id AND public.is_student(auth.uid()));

CREATE POLICY "Students can update own orders"
  ON student_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Admins can see and manage all student orders
CREATE POLICY "Admins can view all student orders"
  ON student_orders FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all student orders"
  ON student_orders FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete student orders"
  ON student_orders FOR DELETE
  TO authenticated
  USING (public.can_manage_bookings(auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_orders_student_id     ON student_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_student_orders_tiffin_menu_id ON student_orders(tiffin_menu_id);
CREATE INDEX IF NOT EXISTS idx_student_orders_status         ON student_orders(status);
CREATE INDEX IF NOT EXISTS idx_student_orders_meal_date      ON student_orders(meal_date);
CREATE INDEX IF NOT EXISTS idx_student_orders_order_date     ON student_orders(order_date);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.set_student_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_orders_updated_at ON student_orders;
CREATE TRIGGER trg_student_orders_updated_at
  BEFORE UPDATE ON student_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_student_orders_updated_at();

-- =====================
-- 5. student_payments TABLE
-- =====================

CREATE TABLE IF NOT EXISTS student_payments (
  id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID           NOT NULL REFERENCES student_orders(id) ON DELETE RESTRICT,
  student_id              UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sslcommerz_session_key  TEXT,
  tran_id                 TEXT           UNIQUE,
  val_id                  TEXT,
  amount                  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency                TEXT           NOT NULL DEFAULT 'BDT',
  status                  TEXT           NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  payment_data            JSONB,
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT now()
);

ALTER TABLE student_payments ENABLE ROW LEVEL SECURITY;

-- Students can only view their own payment records
CREATE POLICY "Students can view own payments"
  ON student_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Students can initiate a payment (INSERT) for their own orders
CREATE POLICY "Students can create own payments"
  ON student_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id AND public.is_student(auth.uid()));

-- All admin roles can view payment records
CREATE POLICY "Admins can view all student payments"
  ON student_payments FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Finance and main admin can fully manage payment records
CREATE POLICY "Admins can manage all student payments"
  ON student_payments FOR ALL
  TO authenticated
  USING (public.can_manage_finance(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_payments_order_id   ON student_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_student_id ON student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_tran_id    ON student_payments(tran_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_status     ON student_payments(status);

-- =====================
-- 6. REALTIME
-- =====================

ALTER PUBLICATION supabase_realtime ADD TABLE student_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE student_payments;
