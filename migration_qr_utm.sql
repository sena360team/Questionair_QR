-- ============================================
-- Migration: QR Code + UTM Support
-- ============================================

-- 1. เพิ่ม column project_id ใน qr_codes (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. เพิ่ม UTM columns ใน qr_codes (ถ้ายังไม่มี)
DO $$
BEGIN
    -- utm_source
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'utm_source'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN utm_source TEXT;
    END IF;
    
    -- utm_medium
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'utm_medium'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN utm_medium TEXT;
    END IF;
    
    -- utm_campaign
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'utm_campaign'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN utm_campaign TEXT;
    END IF;
    
    -- utm_content
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'utm_content'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN utm_content TEXT;
    END IF;
    
    -- utm_term
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'utm_term'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN utm_term TEXT;
    END IF;
    
    -- redirect_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'redirect_url'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN redirect_url TEXT;
    END IF;
    
    -- scan_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'scan_count'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN scan_count INTEGER DEFAULT 0;
    END IF;
    
    -- last_scanned_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'last_scanned_at'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN last_scanned_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. เพิ่ม UTM columns ใน submissions (ถ้ายังไม่มี)
DO $$
BEGIN
    -- utm_source
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'utm_source'
    ) THEN
        ALTER TABLE submissions ADD COLUMN utm_source TEXT;
    END IF;
    
    -- utm_medium
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'utm_medium'
    ) THEN
        ALTER TABLE submissions ADD COLUMN utm_medium TEXT;
    END IF;
    
    -- utm_campaign
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'utm_campaign'
    ) THEN
        ALTER TABLE submissions ADD COLUMN utm_campaign TEXT;
    END IF;
    
    -- utm_content
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'utm_content'
    ) THEN
        ALTER TABLE submissions ADD COLUMN utm_content TEXT;
    END IF;
    
    -- utm_term
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'utm_term'
    ) THEN
        ALTER TABLE submissions ADD COLUMN utm_term TEXT;
    END IF;
END $$;

-- 4. สร้าง function สำหรับบันทึกการ scan QR Code
CREATE OR REPLACE FUNCTION record_qr_scan(
    p_qr_code_id UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE qr_codes
    SET 
        scan_count = COALESCE(scan_count, 0) + 1,
        last_scanned_at = NOW()
    WHERE id = p_qr_code_id;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS Policy สำหรับ qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'qr_codes' AND policyname = 'Enable all for qr_codes'
    ) THEN
        CREATE POLICY "Enable all for qr_codes" ON qr_codes
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
