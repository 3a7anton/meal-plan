-- Migration 012: Manual meal times and ordering deadlines

-- 1. Add ordering_deadline_hours to menu_schedules
ALTER TABLE menu_schedules 
ADD COLUMN IF NOT EXISTS ordering_deadline_hours INTEGER NOT NULL DEFAULT 1;

-- 2. Add ordering_deadline_hours to student_tiffin_menu
ALTER TABLE student_tiffin_menu 
ADD COLUMN IF NOT EXISTS ordering_deadline_hours INTEGER NOT NULL DEFAULT 1;

-- Note: time_slot in both tables is already TEXT, so we don't need to change its type.
-- Any enum or fixed hour constraints in frontend code will be removed.
