-- ============================================
-- Fix: Publish Form Version - แก้ไขให้ publish ครั้งแรกได้ version 1
-- ============================================

-- 1. เพิ่ม column fields_hash ในฟอร์ม (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'forms' AND column_name = 'fields_hash'
    ) THEN
        ALTER TABLE forms ADD COLUMN fields_hash TEXT;
    END IF;
END $$;

-- 2. เพิ่ม column published_at และ updated_at ในฟอร์ม (ถ้ายังไม่มี)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'forms' AND column_name = 'published_at'
    ) THEN
        ALTER TABLE forms ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'forms' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE forms ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. สร้างฟังก์ชั่น publish_form ใหม่ (หรือ replace ถ้ามีอยู่แล้ว)
CREATE OR REPLACE FUNCTION publish_form(
    p_form_id UUID,
    p_change_summary TEXT DEFAULT 'Publish ครั้งแรก'
)
RETURNS INTEGER AS $$
DECLARE
    v_version INTEGER;
    v_fields JSONB;
    v_fields_hash TEXT;
BEGIN
    -- ดึง fields ปัจจุบัน
    SELECT fields INTO v_fields FROM forms WHERE id = p_form_id;
    
    -- คำนวณ fields hash
    v_fields_hash := md5(v_fields::TEXT);
    
    -- ตรวจสอบว่ามี version อยู่แล้วหรือไม่
    SELECT COALESCE(MAX(version), 0) INTO v_version 
    FROM form_versions 
    WHERE form_id = p_form_id;
    
    -- ถ้ายังไม่มี version ให้เริ่มที่ 1
    IF v_version = 0 THEN
        v_version := 1;
    ELSE
        v_version := v_version + 1;
    END IF;
    
    -- สร้าง version ใหม่
    INSERT INTO form_versions (form_id, version, fields, fields_hash, change_summary, published_at)
    VALUES (p_form_id, v_version, v_fields, v_fields_hash, p_change_summary, NOW());
    
    -- อัพเดทฟอร์ม
    UPDATE forms SET
        status = 'published',
        current_version = v_version,
        fields_hash = v_fields_hash,
        published_at = NOW()
    WHERE id = p_form_id;
    
    RETURN v_version;
END;
$$ LANGUAGE plpgsql;

-- 4. สร้างฟังก์ชั่น create_new_version สำหรับสร้าง version ใหม่เมื่อแก้ไข
CREATE OR REPLACE FUNCTION create_new_version(
    p_form_id UUID,
    p_change_summary TEXT DEFAULT 'แก้ไขฟอร์ม'
)
RETURNS INTEGER AS $$
DECLARE
    v_new_version INTEGER;
    v_fields JSONB;
    v_fields_hash TEXT;
    v_current_version INTEGER;
    v_current_fields_hash TEXT;
BEGIN
    -- ดึงข้อมูลปัจจุบัน
    SELECT fields, current_version, fields_hash
    INTO v_fields, v_current_version, v_current_fields_hash
    FROM forms WHERE id = p_form_id;
    
    -- คำนวณ fields hash
    v_fields_hash := md5(v_fields::TEXT);
    
    -- ถ้า hash เหมือนเดิม ไม่ต้องสร้าง version ใหม่
    IF v_current_fields_hash IS NOT NULL AND v_current_fields_hash = v_fields_hash THEN
        RETURN v_current_version;
    END IF;
    
    -- คำนวณ version ใหม่
    v_new_version := COALESCE(v_current_version, 0) + 1;
    
    -- สร้าง version ใหม่
    INSERT INTO form_versions (form_id, version, fields, fields_hash, change_summary, published_at)
    VALUES (p_form_id, v_new_version, v_fields, v_fields_hash, p_change_summary, NOW());
    
    -- อัพเดทฟอร์ม
    UPDATE forms SET
        current_version = v_new_version,
        fields_hash = v_fields_hash
    WHERE id = p_form_id;
    
    RETURN v_new_version;
END;
$$ LANGUAGE plpgsql;

-- 5. แก้ไข forms ที่มี current_version = 0 หรือ NULL ให้เป็น 1 (ถ้า status = published)
UPDATE forms 
SET current_version = 1 
WHERE status = 'published' 
AND (current_version IS NULL OR current_version = 0);

-- 6. สร้าง form_version สำหรับฟอร์มที่ published แต่ยังไม่มี version
-- ใช้ updated_at แทน published_at ถ้ายังไม่มี published_at
INSERT INTO form_versions (form_id, version, fields, fields_hash, change_summary, published_at)
SELECT 
    f.id,
    COALESCE(f.current_version, 1),
    f.fields,
    COALESCE(f.fields_hash, md5(f.fields::TEXT)),
    'Publish ครั้งแรก ( migrated )',
    COALESCE(f.published_at, f.updated_at, f.created_at, NOW())
FROM forms f
LEFT JOIN form_versions fv ON f.id = fv.form_id
WHERE f.status = 'published'
AND fv.id IS NULL;

-- 7. ตั้งค่า fields_hash สำหรับฟอร์มที่ยังไม่มี (ทั้ง published และ draft)
UPDATE forms 
SET fields_hash = md5(fields::TEXT)
WHERE fields_hash IS NULL;

-- 8. ตรวจสอบผลลัพธ์
SELECT 
    id,
    code,
    title,
    status,
    current_version,
    (SELECT COUNT(*) FROM form_versions WHERE form_id = f.id) as version_count
FROM forms f
ORDER BY current_version;
