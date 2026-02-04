-- Fix qr_codes table for project relationship

-- Add project_id column if not exists
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Enable RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all access" ON qr_codes;
DROP POLICY IF EXISTS "Allow all" ON qr_codes;
DROP POLICY IF EXISTS "Public access" ON qr_codes;

-- Create policy for all access (adjust as needed for production)
CREATE POLICY "Enable all access" ON qr_codes
FOR ALL USING (true) WITH CHECK (true);

-- Add comments
COMMENT ON COLUMN qr_codes.project_id IS 'Reference to project for grouping QR codes';
