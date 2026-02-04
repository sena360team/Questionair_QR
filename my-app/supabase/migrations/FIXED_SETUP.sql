-- Complete Setup for Questionnaire QR System
-- Run this in Supabase SQL Editor

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Projects Table
-- ============================================
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

-- ============================================
-- 2. Forms Table
-- ============================================
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    allow_multiple_responses BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft',
    current_version INTEGER DEFAULT 0,
    fields_hash VARCHAR(32),
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id),
    require_consent BOOLEAN DEFAULT false,
    consent_text TEXT DEFAULT 'ข้าพเจ้ายินยอมให้เก็บข้อมูลส่วนบุคคล',
    consent_require_location BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);

-- ============================================
-- 3. Form Versions Table
-- ============================================
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

-- ============================================
-- 4. QR Codes Table
-- ============================================
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
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(qr_slug);

-- ============================================
-- 5. Submissions Table
-- ============================================
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
    consent_given BOOLEAN DEFAULT false,
    consent_ip INET,
    consent_location JSONB,
    consented_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_submissions_form ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

-- ============================================
-- 6. Functions
-- ============================================
CREATE OR REPLACE FUNCTION generate_fields_hash(fields JSONB)
RETURNS VARCHAR(32) AS $$
BEGIN
    RETURN MD5(fields::TEXT);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION publish_form(p_form_id UUID, p_change_summary TEXT DEFAULT 'Publish')
RETURNS INTEGER AS $$
DECLARE
    v_fields JSONB;
    v_hash VARCHAR(32);
BEGIN
    SELECT fields INTO v_fields FROM forms WHERE id = p_form_id;
    v_hash := generate_fields_hash(v_fields);
    INSERT INTO form_versions (form_id, version, fields, fields_hash, change_summary)
    VALUES (p_form_id, 1, v_fields, v_hash, p_change_summary);
    UPDATE forms SET status = 'published', current_version = 1, fields_hash = v_hash, published_at = NOW()
    WHERE id = p_form_id;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION record_qr_scan(qr_slug_param VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE qr_codes SET scan_count = scan_count + 1, last_scanned_at = NOW()
    WHERE qr_slug = qr_slug_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Disable RLS for development
-- ============================================
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions DISABLE ROW LEVEL SECURITY;

-- Done!
