-- Atomic booking creation to prevent race conditions on capacity
-- Uses row-level locking (FOR UPDATE) to ensure two concurrent bookings
-- cannot both pass the capacity check for the last slot.

CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_user_id uuid,
  p_menu_schedule_id uuid,
  p_notes text DEFAULT NULL
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
  v_booking_id uuid;
BEGIN
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
  SELECT count(*) INTO v_conflict_count
  FROM bookings b
  JOIN menu_schedules ms ON ms.id = b.menu_schedule_id
  WHERE b.user_id = p_user_id
    AND b.status IN ('pending', 'confirmed')
    AND ms.scheduled_date = v_scheduled_date
    AND ms.time_slot = v_time_slot;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'You already have a booking at this time slot';
  END IF;

  -- Check capacity
  SELECT count(*) INTO v_current_count
  FROM bookings
  WHERE menu_schedule_id = p_menu_schedule_id
    AND status IN ('pending', 'confirmed');

  IF v_current_count >= v_capacity THEN
    RAISE EXCEPTION 'This time slot is fully booked';
  END IF;

  -- Create the booking
  INSERT INTO bookings (user_id, menu_schedule_id, status, notes)
  VALUES (p_user_id, p_menu_schedule_id, 'pending', p_notes)
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;
