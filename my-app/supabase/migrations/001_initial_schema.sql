-- ============================================================
-- Questionnaire QR System - Complete Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: projects (โครงการ)
-- ============================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,        -- รหัสโครงการ (e.g., "BGHBK", "BN3")
    name VARCHAR(255) NOT NULL,              -- ชื่อโครงการ (e.g., "ซื่อป้าสี่ บางแค")
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE projects IS 'ตารางเก็บข้อมูลโครงการ';
COMMENT ON COLUMN projects.code IS 'รหัสโครงการสั้นๆ ใช้อ้างอิงใน QR Code';

-- Indexes
CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_active ON projects(is_active);

-- ============================================================
-- Table: forms (แบบสอบถาม)
-- ============================================================
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,        -- รหัสแบบสอบถาม (e.g., "FRM-001")
    slug VARCHAR(255) UNIQUE NOT NULL,       -- ใช้ใน URL (/form/:slug)
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- โครงสร้างฟอร์ม (JSONB)
    -- ตัวอย่าง: [
    --   { "id": "q1", "type": "text", "label": "ชื่อ", "required": true },
    --   { "id": "q2", "type": "choice", "label": "เพศ", "options": ["ชาย", "หญิง"] },
    --   { "id": "q3", "type": "heading", "label": "หัวข้อใหญ่" },
    --   { "id": "q4", "type": "info_box", "label": "คำแนะนำ", "helpText": "..." }
    -- ]
    fields JSONB NOT NULL DEFAULT '[]',
    
    -- การตั้งค่า
    is_active BOOLEAN DEFAULT true,
    allow_multiple_responses BOOLEAN DEFAULT false,
    
    -- เวลา
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9_-]+$'),
    CONSTRAINT valid_code CHECK (code ~ '^[A-Z0-9-]+$')
);

COMMENT ON TABLE forms IS 'ตารางเก็บข้อมูลแบบสอบถาม';
COMMENT ON COLUMN forms.fields IS 'โครงสร้างคำถามทั้งหมดในรูปแบบ JSON';

-- Indexes
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_code ON forms(code);
CREATE INDEX idx_forms_active ON forms(is_active);

-- ============================================================
-- Table: qr_codes (QR Code แบบ Dynamic)
-- ============================================================
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- ผูกกับฟอร์ม
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    
    -- ผูกกับโครงการ (ถ้ามี)
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- ชื่อ QR Code (สำหรับจำแนก)
    name VARCHAR(255) NOT NULL,
    
    -- QR Code slug (สำหรับสร้าง URL /qr/:qr_slug)
    qr_slug VARCHAR(255) UNIQUE NOT NULL,
    
    -- UTM Parameters (สำหรับ track แหล่งที่มา)
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(500),
    utm_content VARCHAR(500),  -- ใช้แยก QR ตำแหน่ง/สาขา
    utm_term VARCHAR(255),
    
    -- ลิงก์ปลายทาง (Dynamic QR - เปลี่ยนได้ไม่ต้องพิมพ์ใหม่)
    redirect_url TEXT,
    
    -- สถิติ
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    
    -- เวลา
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_qr_slug CHECK (qr_slug ~ '^[a-z0-9_-]+$')
);

COMMENT ON TABLE qr_codes IS 'ตารางเก็บ QR Code แบบ Dynamic';
COMMENT ON COLUMN qr_codes.project_id IS 'เชื่อมโยงกับโครงการ (optional)';

-- Indexes
CREATE INDEX idx_qr_codes_form ON qr_codes(form_id);
CREATE INDEX idx_qr_codes_project ON qr_codes(project_id);
CREATE INDEX idx_qr_codes_slug ON qr_codes(qr_slug);

-- ============================================================
-- Table: submissions (คำตอบจากผู้ใช้)
-- ============================================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- ผูกกับฟอร์ม
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    
    -- ผูกกับ QR Code (ถ้ามี)
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    
    -- ผูกกับโครงการ (ถ้ามี)
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- คำตอบ (JSON)
    -- ตัวอย่าง: { "q1": "สมชาย", "q2": "ชาย", "q3": 4 }
    responses JSONB NOT NULL DEFAULT '{}',
    
    -- UTM Parameters (บันทึกตอนที่ผู้ใช้เข้ามา)
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(500),
    utm_content VARCHAR(500),
    utm_term VARCHAR(255),
    
    -- Additional tracking
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- ป้องกัน spam/duplicate
    fingerprint VARCHAR(255),
    
    -- เวลา
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE submissions IS 'ตารางเก็บคำตอบจากผู้ใช้ พร้อม UTM tracking';
COMMENT ON COLUMN submissions.responses IS 'คำตอบทั้งหมดในรูปแบบ JSON {field_id: value}';

-- Indexes
CREATE INDEX idx_submissions_form ON submissions(form_id);
CREATE INDEX idx_submissions_qr ON submissions(qr_code_id);
CREATE INDEX idx_submissions_project ON submissions(project_id);
CREATE INDEX idx_submissions_utm_source ON submissions(utm_source);
CREATE INDEX idx_submissions_utm_campaign ON submissions(utm_campaign);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_submissions_fingerprint ON submissions(fingerprint);
CREATE INDEX idx_submissions_responses ON submissions USING GIN(responses);

-- ============================================================
-- Views สำหรับ Analytics
-- ============================================================

-- View: สรุปผลตาม UTM Source
CREATE VIEW analytics_utm_summary AS
SELECT 
    form_id,
    project_id,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    COUNT(*) as submission_count,
    MIN(submitted_at) as first_submission,
    MAX(submitted_at) as last_submission
FROM submissions
WHERE submitted_at > NOW() - INTERVAL '90 days'
GROUP BY form_id, project_id, utm_source, utm_medium, utm_campaign, utm_content;

-- View: สรุป QR Code Performance
CREATE VIEW analytics_qr_performance AS
SELECT 
    qr.id,
    qr.name,
    qr.qr_slug,
    qr.form_id,
    f.title as form_title,
    qr.project_id,
    p.name as project_name,
    qr.utm_source as default_utm_source,
    qr.utm_medium as default_utm_medium,
    qr.utm_campaign as default_utm_campaign,
    qr.utm_content as default_utm_content,
    qr.scan_count,
    qr.last_scanned_at,
    COUNT(s.id) as actual_submissions,
    qr.created_at
FROM qr_codes qr
JOIN forms f ON qr.form_id = f.id
LEFT JOIN projects p ON qr.project_id = p.id
LEFT JOIN submissions s ON qr.id = s.qr_code_id
GROUP BY qr.id, qr.name, qr.qr_slug, qr.form_id, f.title, qr.project_id, p.name,
         qr.utm_source, qr.utm_medium, qr.utm_campaign, qr.utm_content,
         qr.scan_count, qr.last_scanned_at, qr.created_at;

-- View: สรุปผลตามโครงการ
CREATE VIEW analytics_project_summary AS
SELECT 
    p.id as project_id,
    p.code as project_code,
    p.name as project_name,
    COUNT(DISTINCT qr.id) as total_qr_codes,
    COALESCE(SUM(qr.scan_count), 0) as total_scans,
    COUNT(DISTINCT s.id) as total_submissions,
    CASE 
        WHEN SUM(qr.scan_count) > 0 
        THEN ROUND(COUNT(DISTINCT s.id)::numeric / NULLIF(SUM(qr.scan_count), 0) * 100, 2)
        ELSE 0 
    END as conversion_rate
FROM projects p
LEFT JOIN qr_codes qr ON p.id = qr.project_id
LEFT JOIN submissions s ON qr.id = s.qr_code_id
GROUP BY p.id, p.code, p.name;

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: บันทึกการสแกน QR Code
CREATE OR REPLACE FUNCTION record_qr_scan(qr_slug_param VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE qr_codes 
    SET scan_count = scan_count + 1,
        last_scanned_at = NOW()
    WHERE qr_slug = qr_slug_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Projects: ทุกคนอ่านได้, เจ้าของเท่านั้นแก้ไข
CREATE POLICY "Allow public read projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Allow owner full access projects" ON projects
    FOR ALL USING (auth.uid() = created_by);

-- Forms: ทุกคนอ่าน active ได้, เจ้าของเท่านั้นแก้ไข
CREATE POLICY "Allow public read active forms" ON forms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow owner full access forms" ON forms
    FOR ALL USING (auth.uid() = created_by);

-- QR Codes: ทุกคนอ่านได้, เจ้าของเท่านั้นแก้ไข
CREATE POLICY "Allow public read qr codes" ON qr_codes
    FOR SELECT USING (true);

CREATE POLICY "Allow owner qr write" ON qr_codes
    FOR ALL USING (auth.uid() = created_by);

-- Submissions: ทุกคนส่งคำตอบได้, เจ้าของฟอร์มอ่านได้
CREATE POLICY "Allow public insert submissions" ON submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow owner read submissions" ON submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM forms f 
            WHERE f.id = submissions.form_id 
            AND f.created_by = auth.uid()
        )
    );
