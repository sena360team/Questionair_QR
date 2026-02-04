-- Add logo_url column to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN forms.logo_url IS 'URL ของ Logo ที่แสดงในหัวฟอร์ม';
