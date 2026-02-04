-- ============================================================
-- Form Version System with Draft/Published
-- ============================================================

-- เพิ่มฟิลด์สำหรับจัดการสถานะและ version
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',      -- draft | published | archived
ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 0,       -- 0 = ยังไม่เคย publish
ADD COLUMN IF NOT EXISTS fields_hash VARCHAR(32),                 -- ตรวจสอบการเปลี่ยนแปลง
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,                -- วันที่ publish ล่าสุด
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id);

-- Index สำหรับค้นหา
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_version ON forms(current_version);

-- ตารางเก็บประวัติ version (เฉพาะตอน publish/แก้ไขหลัง publish)
CREATE TABLE IF NOT EXISTS form_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    fields JSONB NOT NULL,
    fields_hash VARCHAR(32) NOT NULL,
    change_summary TEXT,                                              -- อธิบายสั้นๆ ว่าแก้อะไร
    published_at TIMESTAMPTZ DEFAULT NOW(),
    published_by UUID REFERENCES auth.users(id),
    
    UNIQUE(form_id, version)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_form_versions_form ON form_versions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_version ON form_versions(form_id, version);

-- เพิ่ม version ใน submissions (เชื่อมกับ form_versions)
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS form_version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_submissions_version ON submissions(form_id, form_version);

-- Comment อธิบาย
COMMENT ON COLUMN forms.status IS 'draft=กำลังสร้าง, published=ใช้งานได้, archived=เก็บถาวร';
COMMENT ON COLUMN forms.current_version IS 'version ล่าสุดที่ publish (0=ยังไม่เคย publish)';
COMMENT ON COLUMN forms.fields_hash IS 'MD5 hash ของ fields ใช้ตรวจสอบการเปลี่ยนแปลง';
COMMENT ON COLUMN form_versions.change_summary IS 'อธิบายสั้นๆ เช่น "เพิ่มคำถามอีเมล", "แก้ไขคำผิด"';
COMMENT ON COLUMN submissions.form_version IS 'version ของฟอร์มตอนที่ส่งคำตอบ';

-- ============================================================
-- View สำหรับดึงข้อมูลพร้อมคำถามตรง version
-- ============================================================

-- View: Submissions พร้อมคำถามตรง version
CREATE OR REPLACE VIEW submissions_with_questions AS
SELECT 
    s.id as submission_id,
    s.form_id,
    s.form_version,
    s.responses,
    s.submitted_at,
    s.consent_given,
    s.consent_ip,
    s.consent_location,
    s.utm_source,
    s.utm_medium,
    s.utm_campaign,
    s.utm_content,
    f.title as form_title,
    f.code as form_code,
    fv.fields as questions_at_submission_time,
    qr.name as qr_code_name,
    p.name as project_name
FROM submissions s
JOIN forms f ON s.form_id = f.id
LEFT JOIN form_versions fv ON s.form_id = fv.form_id AND s.form_version = fv.version
LEFT JOIN qr_codes qr ON s.qr_code_id = qr.id
LEFT JOIN projects p ON s.project_id = p.id;

-- View: สรุป version ของแต่ละฟอร์ม
CREATE OR REPLACE VIEW form_version_summary AS
SELECT 
    f.id as form_id,
    f.code,
    f.title,
    f.status,
    f.current_version,
    f.published_at,
    COUNT(fv.version) as total_versions,
    COUNT(s.id) as total_submissions,
    COUNT(s.id) FILTER (WHERE s.form_version = f.current_version) as submissions_latest_version
FROM forms f
LEFT JOIN form_versions fv ON f.id = fv.form_id
LEFT JOIN submissions s ON f.id = s.form_id
GROUP BY f.id, f.code, f.title, f.status, f.current_version, f.published_at;

-- ============================================================
-- Function: Generate MD5 Hash สำหรับ fields
-- ============================================================

CREATE OR REPLACE FUNCTION generate_fields_hash(fields JSONB)
RETURNS VARCHAR(32) AS $$
BEGIN
    RETURN MD5(fields::TEXT);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- Function: Publish Form (ครั้งแรก)
-- ============================================================

CREATE OR REPLACE FUNCTION publish_form(
    p_form_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_fields JSONB;
    v_hash VARCHAR(32);
BEGIN
    -- ดึง fields ปัจจุบัน
    SELECT fields INTO v_fields FROM forms WHERE id = p_form_id;
    
    -- สร้าง hash
    v_hash := generate_fields_hash(v_fields);
    
    -- สร้าง version 1
    INSERT INTO form_versions (form_id, version, fields, fields_hash, change_summary, published_by)
    VALUES (p_form_id, 1, v_fields, v_hash, 'Publish ครั้งแรก', p_user_id);
    
    -- อัพเดทฟอร์ม
    UPDATE forms 
    SET status = 'published',
        current_version = 1,
        fields_hash = v_hash,
        published_at = NOW(),
        published_by = p_user_id
    WHERE id = p_form_id;
    
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: Create New Version (หลังจาก publish แล้ว)
-- ============================================================

CREATE OR REPLACE FUNCTION create_new_version(
    p_form_id UUID,
    p_change_summary TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_fields JSONB;
    v_old_hash VARCHAR(32);
    v_new_hash VARCHAR(32);
    v_new_version INTEGER;
BEGIN
    -- ดึงข้อมูลปัจจุบัน
    SELECT fields, fields_hash, current_version 
    INTO v_fields, v_old_hash, v_new_version
    FROM forms WHERE id = p_form_id;
    
    -- สร้าง hash ใหม่
    v_new_hash := generate_fields_hash(v_fields);
    
    -- เช็คว่ามีการเปลี่ยนแปลงจริง
    IF v_new_hash = v_old_hash THEN
        RETURN v_new_version; -- ไม่มีการเปลี่ยน
    END IF;
    
    -- เพิ่ม version
    v_new_version := v_new_version + 1;
    
    -- สร้าง version ใหม่
    INSERT INTO form_versions (form_id, version, fields, fields_hash, change_summary, published_by)
    VALUES (p_form_id, v_new_version, v_fields, v_new_hash, p_change_summary, p_user_id);
    
    -- อัพเดทฟอร์ม
    UPDATE forms 
    SET current_version = v_new_version,
        fields_hash = v_new_hash,
        published_at = NOW(),
        published_by = p_user_id
    WHERE id = p_form_id;
    
    RETURN v_new_version;
END;
$$ LANGUAGE plpgsql;
