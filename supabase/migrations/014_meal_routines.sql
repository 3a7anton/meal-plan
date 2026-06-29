-- Migration 014: Meal Routines feature
-- Adds support for bulk scheduling meals via routines.
-- Created: 2026-06-29

-- =====================
-- 1. meal_routines
-- =====================
CREATE TABLE meal_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  routine_type TEXT DEFAULT 'weekly' CHECK (routine_type IN ('weekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meal_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage meal routines"
  ON meal_routines FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active meal routines"
  ON meal_routines FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin(auth.uid()));


-- =====================
-- 2. meal_routine_items
-- =====================
CREATE TABLE meal_routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES meal_routines(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  day_of_month INT CHECK (day_of_month >= 1 AND day_of_month <= 31),
  time_slot TEXT NOT NULL,
  capacity INT DEFAULT 10,
  ordering_deadline_hours INT DEFAULT 1,
  meal_type TEXT CHECK (meal_type IN ('employee', 'student', 'both')),
  price DECIMAL(10,2)
);

-- Ensure that either day_of_week or day_of_month is set based on routine_type
-- Note: A cross-table check constraint is tricky, so we just enforce that at least one is NOT NULL if needed,
-- but the application layer will handle populating the correct field.
ALTER TABLE meal_routine_items ADD CONSTRAINT chk_routine_item_day
  CHECK (day_of_week IS NOT NULL OR day_of_month IS NOT NULL);

ALTER TABLE meal_routine_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage meal routine items"
  ON meal_routine_items FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view meal routine items"
  ON meal_routine_items FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for fast querying
CREATE INDEX idx_meal_routine_items_routine_id ON meal_routine_items(routine_id);
CREATE INDEX idx_meal_routine_items_meal_id ON meal_routine_items(meal_id);
