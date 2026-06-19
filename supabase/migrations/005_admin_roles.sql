-- Migration: Update admin role system to support granular permissions
-- Created: 2025-04-20

-- Update profiles table to support new admin roles
-- Roles: employee, admin, food_editor, finance_editor

-- First, drop the existing CHECK constraint temporarily
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update any existing invalid roles to valid values
-- Convert 'main_admin' to 'admin' (backward compatibility)
UPDATE profiles SET role = 'admin' WHERE role = 'main_admin';

-- Ensure all roles are valid (default any unexpected roles to 'employee')
UPDATE profiles SET role = 'employee' 
WHERE role NOT IN ('employee', 'admin', 'food_editor', 'finance_editor');

-- Now add the new CHECK constraint with all valid roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('employee', 'admin', 'food_editor', 'finance_editor'));

-- Update RLS policies to use the new role system
-- Drop old admin-based policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage meals" ON meals;
DROP POLICY IF EXISTS "Admins can manage schedules" ON menu_schedules;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;

-- Create helper function to check if user is any type of admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'food_editor', 'finance_editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is main admin (now 'admin')
CREATE OR REPLACE FUNCTION public.is_main_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user can manage bookings (admin only)
CREATE OR REPLACE FUNCTION public.can_manage_bookings(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user can manage meals (admin or food_editor)
CREATE OR REPLACE FUNCTION public.can_manage_meals(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'food_editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user can manage finance (admin or finance_editor)
CREATE OR REPLACE FUNCTION public.can_manage_finance(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'finance_editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies with new role system
-- Profiles policies
DROP POLICY IF EXISTS "Main admins can update all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_main_admin(auth.uid()));

-- Meals policies (food_editor and admin can manage)
DROP POLICY IF EXISTS "Anyone can view active meals" ON meals;
DROP POLICY IF EXISTS "Food editors can manage meals" ON meals;

CREATE POLICY "Anyone can view active meals"
  ON meals FOR SELECT
  USING (is_active = true OR public.can_manage_meals(auth.uid()));

CREATE POLICY "Food editors can manage meals"
  ON meals FOR ALL
  USING (public.can_manage_meals(auth.uid()));

-- Menu schedules policies (food_editor and admin can manage)
DROP POLICY IF EXISTS "Anyone can view available schedules" ON menu_schedules;
DROP POLICY IF EXISTS "Food editors can manage schedules" ON menu_schedules;

CREATE POLICY "Anyone can view available schedules"
  ON menu_schedules FOR SELECT
  USING (is_available = true OR public.can_manage_meals(auth.uid()));

CREATE POLICY "Food editors can manage schedules"
  ON menu_schedules FOR ALL
  USING (public.can_manage_meals(auth.uid()));

-- Bookings policies (all admin types can view, admin can modify)
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Main admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Main admins can delete bookings" ON bookings;

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all bookings"
  ON bookings FOR UPDATE
  USING (public.can_manage_bookings(auth.uid()));

CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE
  USING (public.can_manage_bookings(auth.uid()));

-- Payments policies (finance_editor and admin can manage)
DROP POLICY IF EXISTS "Finance editors can manage payments" ON payments;

CREATE POLICY "Finance editors can manage payments"
  ON payments FOR ALL
  USING (public.can_manage_finance(auth.uid()));
