-- ============================================================
-- Add Consent Stamp Feature
-- ============================================================

-- เพิ่มฟิลด์ใน forms: ตั้งค่าให้มี consent หรือไม่
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS require_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_text TEXT DEFAULT 'ข้าพเจ้ายินยอมให้เก็บข้อมูลส่วนบุคคลตามที่ระบุในแบบสอบถามนี้',
ADD COLUMN IF NOT EXISTS consent_require_location BOOLEAN DEFAULT false;  -- ขอตำแหน่ง GPS หรือไม่

-- เพิ่มฟิลด์ใน submissions: เก็บ log การยินยอม
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_ip INET,
ADD COLUMN IF NOT EXISTS consent_location JSONB,  -- { latitude, longitude, accuracy, address }
ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ;

-- Index สำหรับค้นหา consent
CREATE INDEX IF NOT EXISTS idx_submissions_consent_given ON submissions(consent_given);
CREATE INDEX IF NOT EXISTS idx_submissions_consented_at ON submissions(consented_at);

-- Comment อธิบาย
COMMENT ON COLUMN forms.require_consent IS 'ต้องการให้ผู้ใช้กดยินยอมก่อนส่งหรือไม่';
COMMENT ON COLUMN forms.consent_text IS 'ข้อความแสดงความยินยอมที่จะแสดงให้ผู้ใช้';
COMMENT ON COLUMN forms.consent_require_location IS 'ต้องการขอตำแหน่ง GPS จากผู้ใช้หรือไม่';
COMMENT ON COLUMN submissions.consent_given IS 'ผู้ใช้ได้กดยินยอมหรือไม่';
COMMENT ON COLUMN submissions.consent_ip IS 'IP Address ตอนที่กดยินยอม';
COMMENT ON COLUMN submissions.consent_location IS 'ตำแหน่ง GPS {latitude, longitude, accuracy}';
COMMENT ON COLUMN submissions.consented_at IS 'เวลาที่กดยินยอม';

-- ============================================================
-- View สำหรับดู Consent Summary
-- ============================================================

CREATE OR REPLACE VIEW analytics_consent_summary AS
SELECT 
    f.id as form_id,
    f.title as form_title,
    f.require_consent,
    COUNT(s.id) as total_submissions,
    COUNT(s.id) FILTER (WHERE s.consent_given = true) as consent_given_count,
    COUNT(s.id) FILTER (WHERE s.consent_given = false OR s.consent_given IS NULL) as no_consent_count,
    CASE 
        WHEN COUNT(s.id) > 0 
        THEN ROUND(COUNT(s.id) FILTER (WHERE s.consent_given = true)::numeric / COUNT(s.id) * 100, 2)
        ELSE 0 
    END as consent_rate_percent
FROM forms f
LEFT JOIN submissions s ON f.id = s.form_id
GROUP BY f.id, f.title, f.require_consent;
