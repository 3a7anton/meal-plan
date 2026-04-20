-- Add quantity support for bookings
-- This allows users to book multiple portions of the same meal

-- Add quantity column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;

-- Drop the unique constraint that prevents multiple bookings per schedule per user
-- We now allow multiple bookings with different quantities (or could accumulate)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_menu_schedule_id_key;

-- Create index for faster quantity sum queries
CREATE INDEX IF NOT EXISTS idx_bookings_quantity ON bookings(quantity);

-- Drop old function signature to avoid ambiguity
DROP FUNCTION IF EXISTS create_booking_atomic(uuid, uuid, text);

-- Update the atomic booking function to support quantity
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_user_id uuid,
  p_menu_schedule_id uuid,
  p_notes text DEFAULT NULL,
  p_quantity int DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity int;
  v_current_count int;
  v_scheduled_date date;
  v_time_slot text;
  v_conflict_count int;
  v_user_existing_quantity int;
  v_booking_id uuid;
BEGIN
  -- Validate quantity
  IF p_quantity < 1 OR p_quantity > 10 THEN
    RAISE EXCEPTION 'Quantity must be between 1 and 10';
  END IF;

  -- Lock the schedule row to prevent concurrent capacity checks
  SELECT capacity, scheduled_date, time_slot
  INTO v_capacity, v_scheduled_date, v_time_slot
  FROM menu_schedules
  WHERE id = p_menu_schedule_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found';
  END IF;

  -- Check for time slot conflict (user already booked this date+slot)
  -- Calculate total quantity already booked by user at this slot
  SELECT COALESCE(SUM(quantity), 0) INTO v_user_existing_quantity
  FROM bookings b
  JOIN menu_schedules ms ON ms.id = b.menu_schedule_id
  WHERE b.user_id = p_user_id
    AND b.status IN ('pending', 'confirmed')
    AND ms.scheduled_date = v_scheduled_date
    AND ms.time_slot = v_time_slot;

  IF v_user_existing_quantity > 0 THEN
    RAISE EXCEPTION 'You already have a booking at this time slot with % portion(s). Cancel it first to book again.', v_user_existing_quantity;
  END IF;

  -- Check capacity using sum of quantities (not just count)
  SELECT COALESCE(SUM(quantity), 0) INTO v_current_count
  FROM bookings
  WHERE menu_schedule_id = p_menu_schedule_id
    AND status IN ('pending', 'confirmed');

  IF (v_current_count + p_quantity) > v_capacity THEN
    RAISE EXCEPTION 'Not enough capacity. Only % spots remaining, but you requested %.', (v_capacity - v_current_count), p_quantity;
  END IF;

  -- Create the booking with quantity
  INSERT INTO bookings (user_id, menu_schedule_id, status, notes, quantity)
  VALUES (p_user_id, p_menu_schedule_id, 'pending', p_notes, p_quantity)
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;
