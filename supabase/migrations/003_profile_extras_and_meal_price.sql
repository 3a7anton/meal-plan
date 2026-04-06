-- Migration 003: Profile extras, meal price, and pending approval by default

-- 1. Add phone and avatar_url to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;

-- 2. Add price to meals (in taka / local currency, stored as numeric)
ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS price numeric(10,2) NOT NULL DEFAULT 0;

-- 3. Make new users start as inactive (pending admin approval)
--    Update the existing trigger function that creates a profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, department, dietary_preferences, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    NEW.raw_user_meta_data->>'department',
    NULL,
    'employee',
    false  -- Must be approved by admin before logging in
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
