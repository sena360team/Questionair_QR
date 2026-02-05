-- ============================================
-- 1. เพิ่ม Column current_version (ถ้ายังไม่มี)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'forms' AND column_name = 'current_version'
    ) THEN
        ALTER TABLE forms ADD COLUMN current_version INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- 2. สร้าง RLS Policy สำหรับ Update forms
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'forms' AND policyname = 'Enable update for all'
    ) THEN
        CREATE POLICY "Enable update for all" ON forms
        FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================
-- 3. สร้าง Table form_versions (ถ้ายังไม่มี)
-- ============================================
CREATE TABLE IF NOT EXISTS form_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    fields_hash TEXT,
    change_summary TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index สำหรับค้นหา
CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON form_versions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_version ON form_versions(version);

-- RLS Policy สำหรับ form_versions
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'form_versions' AND policyname = 'Enable all for authenticated'
    ) THEN
        CREATE POLICY "Enable all for authenticated" ON form_versions
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================
-- 4. Update forms ที่มี status = published แต่ยังไม่มี version
-- ============================================
UPDATE forms 
SET current_version = 1 
WHERE status = 'published' 
AND current_version IS NULL;

-- สร้าง version แรกสำหรับ forms ที่ published แล้วแต่ยังไม่มีในตาราง form_versions
INSERT INTO form_versions (form_id, version, fields, change_summary, published_at)
SELECT 
    f.id,
    COALESCE(f.current_version, 1),
    f.fields,
    'Initial version',
    NOW()
FROM forms f
LEFT JOIN form_versions fv ON f.id = fv.form_id
WHERE f.status = 'published'
AND fv.id IS NULL;
