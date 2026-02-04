-- Add project_id column to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN submissions.project_id IS 'Reference to project (from QR Code UTM)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_submissions_project_id ON submissions(project_id);
