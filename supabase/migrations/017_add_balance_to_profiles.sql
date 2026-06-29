-- Migration 017: Add balance to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;
