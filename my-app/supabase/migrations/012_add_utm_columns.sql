-- Add UTM columns to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- Add comments
COMMENT ON COLUMN submissions.utm_source IS 'UTM source (e.g., qr_code)';
COMMENT ON COLUMN submissions.utm_medium IS 'UTM medium (e.g., offline)';
COMMENT ON COLUMN submissions.utm_campaign IS 'UTM campaign (e.g., QR name)';
COMMENT ON COLUMN submissions.utm_content IS 'UTM content/location (e.g., entrance)';
COMMENT ON COLUMN submissions.utm_term IS 'UTM term (optional)';

-- Create indexes for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_submissions_utm_source ON submissions(utm_source);
CREATE INDEX IF NOT EXISTS idx_submissions_utm_campaign ON submissions(utm_campaign);
