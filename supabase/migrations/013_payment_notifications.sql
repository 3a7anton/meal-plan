-- Migration 013: Add payment notification types
-- Drops the old notification type constraint and adds new values.
-- Created: 2026-06-29

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'booking_confirmed',
    'booking_denied',
    'conflict',
    'reminder',
    'cancelled',
    'payment_success',
    'new_payment',
    'payment_pending'
  ));
