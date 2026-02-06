-- ============================================
-- Fix: Add Consent columns to submissions table
-- ============================================

-- 1. เพิ่ม consent_given (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'consent_given'
    ) THEN
        ALTER TABLE submissions ADD COLUMN consent_given BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. เพิ่ม consent_ip (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'consent_ip'
    ) THEN
        ALTER TABLE submissions ADD COLUMN consent_ip TEXT;
    END IF;
END $$;

-- 3. เพิ่ม consent_location (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'consent_location'
    ) THEN
        ALTER TABLE submissions ADD COLUMN consent_location JSONB;
    END IF;
END $$;

-- 4. เพิ่ม consented_at (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'consented_at'
    ) THEN
        ALTER TABLE submissions ADD COLUMN consented_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 5. ตรวจสอบ columns ทั้งหมด
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;
