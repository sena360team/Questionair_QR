-- ============================================
-- Fix: Submissions Table - Add QR Code tracking
-- ============================================

-- 1. เพิ่ม qr_code_id (ถ้ายังไม่มี) - ใช้แบบที่รองรับกรณีมีอยู่แล้ว
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'qr_code_id'
    ) THEN
        ALTER TABLE submissions ADD COLUMN qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL;
    ELSE
        RAISE NOTICE 'Column qr_code_id already exists, skipping...';
    END IF;
END $$;

-- 2. เพิ่ม project_id (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE submissions ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    ELSE
        RAISE NOTICE 'Column project_id already exists, skipping...';
    END IF;
END $$;

-- 3. เพิ่ม form_version (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'form_version'
    ) THEN
        ALTER TABLE submissions ADD COLUMN form_version INTEGER DEFAULT 1;
    ELSE
        RAISE NOTICE 'Column form_version already exists, skipping...';
    END IF;
END $$;

-- 4. สร้าง index สำหรับ performance (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_submissions_qr_code_id'
    ) THEN
        CREATE INDEX idx_submissions_qr_code_id ON submissions(qr_code_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_submissions_project_id'
    ) THEN
        CREATE INDEX idx_submissions_project_id ON submissions(project_id);
    END IF;
END $$;

-- 5. ตรวจสอบ columns ทั้งหมด
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;
