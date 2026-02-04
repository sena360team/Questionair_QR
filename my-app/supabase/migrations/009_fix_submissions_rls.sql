-- Fix submissions table RLS and ensure all columns exist

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for all" ON submissions;
DROP POLICY IF EXISTS "Enable select for all" ON submissions;
DROP POLICY IF EXISTS "Allow all" ON submissions;

-- Create policy for insert (public form submission)
CREATE POLICY "Enable insert for all" ON submissions
FOR INSERT WITH CHECK (true);

-- Create policy for select (admin view)
CREATE POLICY "Enable select for all" ON submissions
FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON submissions TO anon;
GRANT ALL ON submissions TO authenticated;

-- Ensure sequence exists and is accessible
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
