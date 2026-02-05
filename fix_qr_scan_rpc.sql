-- ============================================
-- Fix: สร้าง RPC function สำหรับบันทึก QR Scan ที่รับ qr_slug
-- ============================================

-- ลบ function เก่า (ถ้ามี)
DROP FUNCTION IF EXISTS record_qr_scan(TEXT);
DROP FUNCTION IF EXISTS record_qr_scan(UUID, TEXT, TEXT);

-- สร้าง function ใหม่ที่รับ qr_slug
CREATE OR REPLACE FUNCTION record_qr_scan(qr_slug_param TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE qr_codes
    SET 
        scan_count = COALESCE(scan_count, 0) + 1,
        last_scanned_at = NOW()
    WHERE qr_slug = qr_slug_param;
END;
$$ LANGUAGE plpgsql;

-- สร้าง function ที่รับ qr_code_id (เก็บไว้ใช้กรณีอื่น)
CREATE OR REPLACE FUNCTION record_qr_scan_by_id(p_qr_code_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE qr_codes
    SET 
        scan_count = COALESCE(scan_count, 0) + 1,
        last_scanned_at = NOW()
    WHERE id = p_qr_code_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policy สำหรับ submissions ให้ join ได้
-- ============================================

-- เปิด RLS สำหรับ submissions (ถ้ายังไม่เปิด)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- ลบ policy เก่าถ้ามี
DROP POLICY IF EXISTS "Enable select with joins" ON submissions;
DROP POLICY IF EXISTS "Enable all for submissions" ON submissions;

-- สร้าง policy ใหม่
CREATE POLICY "Enable all for submissions" ON submissions
FOR ALL USING (true) WITH CHECK (true);

-- RLS สำหรับ qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for qr_codes" ON qr_codes;

CREATE POLICY "Enable all for qr_codes" ON qr_codes
FOR ALL USING (true) WITH CHECK (true);

-- RLS สำหรับ projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for projects" ON projects;

CREATE POLICY "Enable all for projects" ON projects
FOR ALL USING (true) WITH CHECK (true);
