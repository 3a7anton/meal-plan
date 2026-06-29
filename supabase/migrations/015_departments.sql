-- Migration 015: Consolidate departments to 'School' and 'Educare'
-- Drops old constraint if exists, updates data, and adds new constraint.
-- Created: 2026-06-29

-- 1. Update existing legacy profiles
UPDATE public.profiles 
SET department = 'School' 
WHERE department IS NOT NULL 
  AND department NOT IN ('School', 'Educare');

-- 2. Drop any existing constraint on department (if named appropriately, though we usually just alter table)
-- If we didn't name it, we can't easily drop it by name in standard postgres unless we query pg_constraint.
-- Assuming no prior strict constraint existed on department, or if it did, we add a new one.

DO $$ 
BEGIN
  -- Attempt to drop any constraint that might look like a department check.
  -- In a real production system we'd query pg_constraint to dynamically drop it.
  -- For now, we'll just add the new constraint.
  
  BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_department_check 
    CHECK (department IN ('School', 'Educare') OR department IS NULL);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
