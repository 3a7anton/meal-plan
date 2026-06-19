-- Create app_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage settings
CREATE POLICY "Admins can manage app_settings" ON app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'food_editor', 'finance_editor')
    )
  );

-- Create policy for all users to read settings
CREATE POLICY "All users can read app_settings" ON app_settings
  FOR SELECT
  USING (true);

-- Insert default settings
INSERT INTO app_settings (key, value, description) VALUES
  ('booking_time_limit', '60', 'Minutes before meal time when booking closes'),
  ('cancellation_time_limit', '120', 'Minutes before meal time when cancellation closes')
ON CONFLICT (key) DO NOTHING;
