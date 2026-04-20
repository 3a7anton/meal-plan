-- Create table for password reset verification codes
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- No access for anyone (only service role can access)
CREATE POLICY "No access" ON password_reset_codes
  FOR ALL
  USING (false);
