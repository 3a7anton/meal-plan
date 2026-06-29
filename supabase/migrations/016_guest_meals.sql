-- Migration 016: Guest Meals
-- Adds support for admin-created guest meals.
-- Created: 2026-06-29

CREATE TABLE guest_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('School', 'Educare')),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  menu_schedule_id UUID REFERENCES menu_schedules(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  notes TEXT,
  meal_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guest_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage guest meals"
  ON guest_meals FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view guest meals"
  ON guest_meals FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for efficient querying
CREATE INDEX idx_guest_meals_date ON guest_meals(meal_date);
CREATE INDEX idx_guest_meals_menu_schedule ON guest_meals(menu_schedule_id);
