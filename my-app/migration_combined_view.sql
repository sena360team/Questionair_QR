-- ============================================
-- Create Combined Submission View
-- รวมข้อมูลทั้งหมดไว้ในที่เดียวสำหรับดึงไปใช้งานภายนอก
-- ============================================

-- สร้าง View รวมข้อมูล submissions พร้อมคำถามคำตอบแบบ flatten
CREATE OR REPLACE VIEW submissions_combined AS
SELECT 
    s.id,
    s.submitted_at,
    s.form_version,
    
    -- ข้อมูลฟอร์ม
    f.code as form_code,
    f.title as form_title,
    f.slug as form_slug,
    
    -- ข้อมูล QR Code
    q.name as qr_code_name,
    q.qr_slug,
    
    -- ข้อมูลโครงการ
    p.code as project_code,
    p.name as project_name,
    
    -- UTM Parameters
    s.utm_source,
    s.utm_medium,
    s.utm_campaign,
    s.utm_content,
    s.utm_term,
    
    -- Consent Stamp
    s.consent_given,
    s.consent_ip,
    s.consented_at,
    CASE 
        WHEN s.consent_location IS NOT NULL 
        THEN concat(s.consent_location->>'latitude', ',', s.consent_location->>'longitude')
        ELSE NULL 
    END as consent_location_latlng,
    
    -- คำตอบทั้งหมดในรูปแบบ JSON (ดึงจาก responses)
    s.responses as answers_json,
    
    -- คำตอบในรูปแบบ Text สำหรับอ่านง่าย
    -- ใช้ jsonb_each_text เพื่อแปลง key-value เป็น text
    (
        SELECT string_agg(
            concat(
                COALESCE(fld.label, rsp.key), 
                ': ', 
                CASE 
                    WHEN jsonb_typeof(rsp.value) = 'array' THEN rsp.value::text
                    ELSE rsp.value #>> '{}'
                END
            ), 
            ' | ' ORDER BY rsp.key
        )
        FROM jsonb_each(s.responses) as rsp(key, value)
        LEFT JOIN LATERAL (
            SELECT label 
            FROM jsonb_to_recordset(f.fields) as fld(id text, label text)
            WHERE fld.id = rsp.key
        ) fld ON true
        WHERE rsp.key != '_consent'
    ) as answers_summary,
    
    -- Metadata
    s.ip_address,
    s.user_agent,
    s.created_at

FROM submissions s
LEFT JOIN forms f ON s.form_id = f.id
LEFT JOIN qr_codes q ON s.qr_code_id = q.id
LEFT JOIN projects p ON s.project_id = p.id;

-- สร้าง Index สำหรับ View (Materialized View ถ้าต้องการ performance สูง)
-- หรือใช้ข้างล่างนี้ถ้าต้องการ Materialized View

-- Drop ถ้ามีอยู่แล้ว
DROP MATERIALIZED VIEW IF EXISTS submissions_combined_mv;

-- สร้าง Materialized View (อัพเดทต้องใช้ REFRESH)
CREATE MATERIALIZED VIEW submissions_combined_mv AS
SELECT 
    s.id,
    s.submitted_at,
    s.form_version,
    
    -- ข้อมูลฟอร์ม
    f.code as form_code,
    f.title as form_title,
    f.slug as form_slug,
    
    -- ข้อมูล QR Code
    q.name as qr_code_name,
    q.qr_slug,
    
    -- ข้อมูลโครงการ
    p.code as project_code,
    p.name as project_name,
    
    -- UTM Parameters
    s.utm_source,
    s.utm_medium,
    s.utm_campaign,
    s.utm_content,
    s.utm_term,
    
    -- Consent Stamp
    s.consent_given,
    s.consent_ip,
    s.consented_at,
    CASE 
        WHEN s.consent_location IS NOT NULL 
        THEN concat(s.consent_location->>'latitude', ',', s.consent_location->>'longitude')
        ELSE NULL 
    END as consent_location_latlng,
    
    -- คำตอบทั้งหมด
    s.responses as answers_json,
    
    -- คำตอบแบบ Text
    (
        SELECT string_agg(
            concat(
                COALESCE(fld.label, rsp.key), 
                ': ', 
                CASE 
                    WHEN jsonb_typeof(rsp.value) = 'array' THEN rsp.value::text
                    ELSE rsp.value #>> '{}'
                END
            ), 
            ' | ' ORDER BY rsp.key
        )
        FROM jsonb_each(s.responses) as rsp(key, value)
        LEFT JOIN LATERAL (
            SELECT label 
            FROM jsonb_to_recordset(f.fields) as fld(id text, label text)
            WHERE fld.id = rsp.key
        ) fld ON true
        WHERE rsp.key != '_consent'
    ) as answers_summary,
    
    -- Metadata
    s.ip_address,
    s.user_agent,
    s.created_at

FROM submissions s
LEFT JOIN forms f ON s.form_id = f.id
LEFT JOIN qr_codes q ON s.qr_code_id = q.id
LEFT JOIN projects p ON s.project_id = p.id;

-- สร้าง Index บน Materialized View
CREATE UNIQUE INDEX idx_submissions_combined_mv_id ON submissions_combined_mv(id);
CREATE INDEX idx_submissions_combined_mv_form ON submissions_combined_mv(form_code);
CREATE INDEX idx_submissions_combined_mv_date ON submissions_combined_mv(submitted_at);
CREATE INDEX idx_submissions_combined_mv_project ON submissions_combined_mv(project_code);

-- สร้าง Function สำหรับ Refresh Materialized View
CREATE OR REPLACE FUNCTION refresh_submissions_combined_mv()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY submissions_combined_mv;
END;
$$ LANGUAGE plpgsql;

-- ให้สิทธิ์การเข้าถึง View
GRANT SELECT ON submissions_combined TO PUBLIC;
GRANT SELECT ON submissions_combined_mv TO PUBLIC;

-- ตัวอย่างการใช้งาน:
-- SELECT * FROM submissions_combined WHERE form_code = 'FRM-001';
-- SELECT * FROM submissions_combined_mv WHERE project_code = 'PRJ-001';
-- SELECT form_code, form_title, answers_summary, consent_given, utm_source FROM submissions_combined;
