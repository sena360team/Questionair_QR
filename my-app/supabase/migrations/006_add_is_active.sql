-- Add is_active column to forms table
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing rows to have is_active = true
UPDATE forms SET is_active = true WHERE is_active IS NULL;

-- Add comment
COMMENT ON COLUMN forms.is_active IS 'เปิด/ปิดการใช้งานฟอร์ม';
