-- Fix submissions table columns
-- Add missing columns for form version and consent stamp

-- Add form_version column
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS form_version INTEGER DEFAULT 1;

-- Add consent stamp columns
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false;

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS consent_ip TEXT;

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS consent_location JSONB;

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS consented_at TIMESTAMP WITH TIME ZONE;

-- Add metadata column
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comments
COMMENT ON COLUMN submissions.form_version IS 'Version of form when submitted';
COMMENT ON COLUMN submissions.consent_given IS 'Whether user gave consent';
COMMENT ON COLUMN submissions.consent_ip IS 'IP address when consent was given';
COMMENT ON COLUMN submissions.consent_location IS 'GPS location when consent was given';
COMMENT ON COLUMN submissions.consented_at IS 'Timestamp when consent was given';
COMMENT ON COLUMN submissions.metadata IS 'Additional metadata like userAgent, referrer';
