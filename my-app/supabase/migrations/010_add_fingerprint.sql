-- Add fingerprint column to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS fingerprint TEXT;

COMMENT ON COLUMN submissions.fingerprint IS 'Browser fingerprint for duplicate detection';
