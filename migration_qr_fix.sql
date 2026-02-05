-- ============================================
-- Fix: QR Code Table - Add missing columns with defaults
-- ============================================

-- 1. เพิ่ม created_at (ถ้ายังไม่มี) พร้อม default
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ELSE
        -- ถ้ามีอยู่แล้ว ตรวจสอบว่ามี default หรือไม่
        ALTER TABLE qr_codes ALTER COLUMN created_at SET DEFAULT NOW();
    END IF;
END $$;

-- 2. เพิ่ม updated_at (ถ้ายังไม่มี) พร้อม default
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ELSE
        ALTER TABLE qr_codes ALTER COLUMN updated_at SET DEFAULT NOW();
    END IF;
END $$;

-- 3. เพิ่ม created_by (ถ้ายังไม่มี) - nullable
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE qr_codes ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. สร้าง trigger สำหรับอัพเดท updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ลบ trigger เก่าถ้ามี (เพื่อป้องกัน error)
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;

-- สร้าง trigger ใหม่
CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. ตรวจสอบและแสดง columns ทั้งหมดในตาราง qr_codes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;
