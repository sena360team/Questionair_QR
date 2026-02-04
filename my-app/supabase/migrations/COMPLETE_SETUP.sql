-- ============================================================
-- Questionnaire QR System - COMPLETE SETUP (Run this first!)
-- ============================================================
-- Copy everything below and paste in Supabase SQL Editor
-- Then click "Run" or press Ctrl+Enter
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: projects (โครงการ)
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active);

COMMENT ON TABLE projects IS 'ตารางเก็บข้อมูลโครงการ';

-- ============================================================
-- Table: forms (แบบสอบถาม)
-- ============================================================
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    allow_multiple_responses BOOLEAN DEFAULT false,
    -- Status & Version
    status VARCHAR(20) DEFAULT 'draft',
    current_version INTEGER DEFAULT 0,
    fields_hash VARCHAR(32),
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id),
    -- Consent
    require_consent BOOLEAN DEFAULT false,
    consent_text TEXT DEFAULT 'ข้าพเจ้ายินยอมให้เก็บข้อมูลส่วนบุคคลตามที่ระบุในแบบสอบถามนี้',
    consent_require_location BOOLEAN DEFAULT false,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9_-]+$'),
    CONSTRAINT valid_code CHECK (code ~ '^[A-Z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_code ON forms(code);
CREATE INDEX IF NOT EXISTS idx_forms_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);

COMMENT ON TABLE forms IS 'ตารางเก็บข้อมูลแบบสอบถาม';

-- ============================================================
-- Table: form_versions (ประวัติ version)
-- ============================================================
CREATE TABLE IF NOT EXISTS form_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    fields JSONB NOT NULL,
    fields_hash VARCHAR(32) NOT NULL,
    change_summary TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    published_by UUID REFERENCES auth.users(id),
    UNIQUE(form_id, version)
);

CREATE INDEX IF NOT EXISTS idx_form_versions_form ON form_versions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_version ON form_versions(form_id, version);

-- ============================================================
-- Table: qr_codes (QR Code)
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    qr_slug VARCHAR(255) UNIQUE NOT NULL,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(500),
    utm_content VARCHAR(500),
    utm_term VARCHAR(255),
    redirect_url TEXT,
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_qr_slug CHECK (qr_slug ~ '^[a-z0-9_-]+$')
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_form ON qr_codes(form_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_project ON qr_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(qr_slug);

-- ============================================================
-- Table: submissions (คำตอบ)
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    form_version INTEGER DEFAULT 1,
    responses JSONB NOT NULL DEFAULT '{}',
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(500),
    utm_content VARCHAR(500),
    utm_term VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    fingerprint VARCHAR(255),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    -- Consent
    consent_given BOOLEAN DEFAULT false,
    consent_ip INET,
    consent_location JSONB,
    consented_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_submissions_form ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_qr ON submissions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_submissions_project ON submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_version ON submissions(form_id, form_version);
CREATE INDEX IF NOT EXISTS idx_submissions_utm_source ON submissions(utm_source);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submissions_consent_given ON submissions(consent_given);

COMMENT ON TABLE submissions IS 'ตารางเก็บคำตอบจากผู้ใช้';

-- ============================================================
-- Auto-update updated_at
-- ============================================================
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

-- ============================================================
-- Function: Generate Hash
-- ============================================================
CREATE OR REPLACE FUNCTION generate_fields_hash(fields JSONB)
RETURNS VARCHAR(32) AS $$
BEGIN
    RETURN MD5(fields::TEXT);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- Function: Publish Form
-- ============================================================
CREATE OR REPLACE FUNCTION publish_form(
    p_form_id UUID,
    p_change_summary TEXT DEFAULT 'Publish ครั้งแรก'
)
RETURNS INTEGER AS $$
DECLARE
    v_fields JSONB;
    v_hash VARCHAR(32);
BEGIN
    SELECT fields INTO v_fields FROM forms WHERE id = p_form_id;
    v_hash := generate_fields_hash(v_fields);
    
    INSERT INTO form_versions (form_id, version, fields, fields_hash, change_summary)
    VALUES (p_form_id, 1, v_fields, v_hash, p_change_summary);
    
    UPDATE forms 
    SET status = 'published',
        current_version = 1,
        fields_hash = v_hash,
        published_at = NOW()
    WHERE id = p_form_id;
    
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: Create New Version
-- ============================================================
CREATE OR REPLACE FUNCTION create_new_version(
    p_form_id UUID,
    p_change_summary TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_fields JSONB;
    v_old_hash VARCHAR(32);
    v_new_hash VARCHAR(32);
    v_new_version INTEGER;
BEGIN
    SELECT fields, fields_hash, current_version 
    INTO v_fields, v_old_hash, v_new_version
    FROM forms WHERE id = p_form_id;
    
    v_new_hash := generate_fields_hash(v_fields);
    IF v_new_hash = v_old_hash THEN
        RETURN v_new_version;
    END IF;
    
    v_new_version := v_new_version + 1;
    
    INSERT INTO form_versions (form_id, version, fields, fields_hash, change_summary)
    VALUES (p_form_id, v_new_version, v_fields, v_new_hash, p_change_summary);
    
    UPDATE forms 
    SET current_version = v_new_version,
        fields_hash = v_new_hash,
        published_at = NOW()
    WHERE id = p_form_id;
    
    RETURN v_new_version;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: Record QR Scan
-- ============================================================
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
-- Views for Analytics
-- ============================================================

CREATE OR REPLACE VIEW analytics_utm_summary AS
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

CREATE OR REPLACE VIEW analytics_qr_performance AS
SELECT 
    qr.id,
    qr.name,
    qr.qr_slug,
    qr.form_id,
    f.title as form_title,
    qr.project_id,
    p.name as project_name,
    qr.utm_source as default_utm_source,
    qr.scan_count,
    qr.last_scanned_at,
    COUNT(s.id) as actual_submissions,
    qr.created_at
FROM qr_codes qr
JOIN forms f ON qr.form_id = f.id
LEFT JOIN projects p ON qr.project_id = p.id
LEFT JOIN submissions s ON qr.id = s.qr_code_id
GROUP BY qr.id, qr.name, qr.qr_slug, qr.form_id, f.title, qr.project_id, p.name,
         qr.utm_source, qr.scan_count, qr.last_scanned_at, qr.created_at;

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

-- ============================================================
-- RLS Policies (เปิดให้ใช้งานทั่วไปก่อน)
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for development)
CREATE POLICY IF NOT EXISTS "Allow all" ON projects FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON forms FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON qr_codes FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON submissions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON form_versions FOR ALL USING (true);

-- ============================================================
-- DONE! Tables are ready to use
-- ============================================================
