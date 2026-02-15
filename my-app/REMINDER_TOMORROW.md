# 🔔 Reminder: สิ่งที่ต้องทำในวันพรุ่งนี้

## ⚠️ รัน SQL Migration ใน Supabase (สำคัญ!)

ไฟล์: `docs/migrations/008_add_logo_settings.sql`

### ขั้นตอน:
1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project → SQL Editor
3. สร้าง New Query
4. Copy & Paste โค้ดด้านล่าง:

```sql
-- ============================================================
-- Migration: Add Logo Position and Size Columns
-- ============================================================

-- Add logo_position column to forms table
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS logo_position TEXT DEFAULT 'center'
CHECK (logo_position IN ('left', 'center', 'right'));

-- Add logo_size column to forms table
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS logo_size TEXT DEFAULT 'medium'
CHECK (logo_size IN ('small', 'medium', 'large'));

-- Add logo_position column to form_drafts table
ALTER TABLE form_drafts 
ADD COLUMN IF NOT EXISTS logo_position TEXT DEFAULT 'center'
CHECK (logo_position IN ('left', 'center', 'right'));

-- Add logo_size column to form_drafts table
ALTER TABLE form_drafts 
ADD COLUMN IF NOT EXISTS logo_size TEXT DEFAULT 'medium'
CHECK (logo_size IN ('small', 'medium', 'large'));

-- Add logo_position column to form_versions table
ALTER TABLE form_versions 
ADD COLUMN IF NOT EXISTS logo_position TEXT DEFAULT 'center'
CHECK (logo_position IN ('left', 'center', 'right'));

-- Add logo_size column to form_versions table
ALTER TABLE form_versions 
ADD COLUMN IF NOT EXISTS logo_size TEXT DEFAULT 'medium'
CHECK (logo_size IN ('small', 'medium', 'large'));

-- Update existing rows with defaults
UPDATE form_drafts SET logo_position = 'center', logo_size = 'medium' WHERE logo_position IS NULL;
UPDATE forms SET logo_position = 'center', logo_size = 'medium' WHERE logo_position IS NULL;
UPDATE form_versions SET logo_position = 'center', logo_size = 'medium' WHERE logo_position IS NULL;

-- Set default values
ALTER TABLE forms ALTER COLUMN logo_position SET DEFAULT 'center';
ALTER TABLE forms ALTER COLUMN logo_size SET DEFAULT 'medium';
ALTER TABLE form_drafts ALTER COLUMN logo_position SET DEFAULT 'center';
ALTER TABLE form_drafts ALTER COLUMN logo_size SET DEFAULT 'medium';
ALTER TABLE form_versions ALTER COLUMN logo_position SET DEFAULT 'center';
ALTER TABLE form_versions ALTER COLUMN logo_size SET DEFAULT 'medium';
```

5. กด **Run** ✅

### หลังรัน SQL:
- Refresh หน้าเว็บ (F5)
- ระบบจะทำงานปกติ (ไม่มี Error 400 อีก)
- ฟีเจอร์ตำแหน่งและขนาด Logo จะใช้งานได้

---

## 📋 สรุปสิ่งที่ทำไปแล้ววันนี้:

### ✅ Theme System (เสร็จแล้ว)
- 4 Themes: Default, Card Groups, Step Wizard, Minimal
- แต่ละ Theme มี Header + Logo + Title + Description

### ✅ Logo Settings (รอ SQL)
- ตำแหน่ง: ซ้าย / กลาง / ขวา (ไม่กระทบ Title)
- ขนาด: เล็ก / กลาง / ใหญ่

### ✅ Section/Heading Fields
- Default: แสดงเป็นหัวข้อ (ไม่มีเลข, ไม่มีกรอบ)
- CardGroups: ใช้แบ่งกลุ่มการ์ด
- StepWizard: ใช้แบ่ง Steps

### ✅ Consent Section
- สีเขียวอ่อน (เข้ากับธีม)
- ไม่ซ้อนกับฟอร์ม

### ✅ UI Improvements
- Settings tab เต็มหน้า
- Theme grid 4 คอลัมน์
- Preview ไม่รีเฟรชตอนแก้ไข

---

**⏰ อย่าลืมรัน SQL ก่อนใช้งานฟีเจอร์ใหม่!**
