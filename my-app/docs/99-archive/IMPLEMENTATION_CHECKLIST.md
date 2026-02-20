# 📋 แผนการ Implement ฟีเจอร์ Version History + Draft + Duplicate

## ✅ สถานะปัจจุบัน

### สิ่งที่เสร็จแล้ว (Code)
- [x] Database Migration Script (`001_add_version_history_and_draft.sql`)
- [x] Type Definitions (`src/types/index.ts`)
- [x] Hooks (`useFormVersions`, `useFormDraft`, `useDuplicateForm`)
- [x] UI Components (`VersionHistory`, `DuplicateFormDialog`)
- [x] Edit Form Page แบบใหม่พร้อม Tabs
- [x] Forms List แบบใหม่พร้อม Action Menu

### สิ่งที่ยังไม่เสร็จ (ต้องทำต่อ)
- [ ] รัน Database Migration บน Supabase
- [ ] ตรวจสอบว่าไม่มีข้อมูลหาย
- [ ] ทดสอบการทำงานทุกฟีเจอร์
- [ ] แก้ไข Bugs ถ้าพบ

---

## 🔧 ขั้นตอนที่ต้องทำต่อ

### ขั้นที่ 1: ตรวจสอบข้อมูลก่อนรัน Migration (สำคัญ!)

ไปที่ **Supabase Dashboard → SQL Editor** แล้วรัน:

```sql
-- ตรวจสอบว่าข้อมูล forms ยังอยู่
SELECT COUNT(*) as forms_count FROM forms;

-- ตรวจสอบ form_versions
SELECT COUNT(*) as versions_count FROM form_versions;

-- ดูตัวอย่างข้อมูล
SELECT id, code, title, status, current_version 
FROM forms 
ORDER BY created_at DESC 
LIMIT 5;
```

**ถ้าผลลัพธ์เป็น:**
- `forms_count = 0` → ❌ อย่ารัน migration! ข้อมูลหายแล้ว ติดต่อผู้ดูแลระบบ
- `forms_count > 0` → ✅ ไปขั้นต่อไป

---

### ขั้นที่ 2: Backup ข้อมูล (สำคัญมาก!)

ก่อนรัน migration ต้อง backup:

#### วิธีที่ 1: Export จาก Supabase Dashboard
1. ไปที่ **Supabase Dashboard → Database → Backup**
2. กด **Create Backup** (ถ้ามีตัวเลือก)

#### วิธีที่ 2: Export ด้วย SQL
```sql
-- Export ข้อมูลสำคัญ
COPY (SELECT * FROM forms) TO '/tmp/forms_backup.csv' WITH CSV HEADER;
COPY (SELECT * FROM form_versions) TO '/tmp/versions_backup.csv' WITH CSV HEADER;
```

---

### ขั้นที่ 3: รัน Database Migration

#### 3.1 ไปที่ Supabase SQL Editor
1. เปิด [app.supabase.com](https://app.supabase.com)
2. เลือก Project ของคุณ
3. ไปที่ **SQL Editor** → **+ New Query**

#### 3.2 รันทีละส่วน (แนะนำ)

**ส่วนที่ 1: Update form_versions**
```sql
-- รันบรรทัดที่ 14-25 จากไฟล์ migration
ALTER TABLE form_versions 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS require_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consent_heading TEXT DEFAULT 'การยินยอม (Consent)',
ADD COLUMN IF NOT EXISTS consent_text TEXT,
ADD COLUMN IF NOT EXISTS consent_require_location BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_reverted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reverted_to_version INTEGER,
ADD COLUMN IF NOT EXISTS created_from_clone UUID REFERENCES forms(id);

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_form_versions_form_id_version 
ON form_versions(form_id, version DESC);
```

**ส่วนที่ 2: Update forms**
```sql
-- รันบรรทัดที่ 38-41
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS cloned_from UUID REFERENCES forms(id),
ADD COLUMN IF NOT EXISTS cloned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parent_form_id UUID REFERENCES forms(id);
```

**ส่วนที่ 3: Create form_drafts table**
```sql
-- รันบรรทัดที่ 54-147
CREATE TABLE IF NOT EXISTS form_drafts (
  -- ... (copy จากไฟล์ migration)
);

-- Enable RLS
ALTER TABLE form_drafts ENABLE ROW LEVEL SECURITY;

-- สร้าง policies
-- ...
```

**ส่วนที่ 4: Create Functions**
```sql
-- รันบรรทัดที่ 154-235 (create_draft_from_version)
-- รันบรรทัดที่ 237-353 (duplicate_form)
-- รันบรรทัดที่ 356-389 (trigger)
```

**ส่วนที่ 5: Backfill Data**
```sql
-- รันบรรทัดที่ 396-408
UPDATE form_versions fv
SET 
  title = f.title,
  description = f.description,
  logo_url = f.logo_url,
  require_consent = COALESCE(f.require_consent, FALSE),
  consent_heading = COALESCE(f.consent_heading, 'การยินยอม (Consent)'),
  consent_text = f.consent_text,
  consent_require_location = COALESCE(f.consent_require_location, FALSE),
  published_by = f.created_by
FROM forms f
WHERE fv.form_id = f.id
AND fv.version = f.current_version;
```

---

### ขั้นที่ 4: ตรวจสอบหลังรัน Migration

รัน SQL นี้เพื่อตรวจสอบ:

```sql
-- 1. ตรวจสอบว่า form_versions มีข้อมูลครบ
SELECT 
  version,
  title IS NOT NULL as has_title,
  published_by IS NOT NULL as has_publisher
FROM form_versions
LIMIT 5;

-- 2. ตรวจสอบว่า form_drafts ถูกสร้างแล้ว
SELECT COUNT(*) as draft_tables 
FROM information_schema.tables 
WHERE table_name = 'form_drafts';

-- 3. ตรวจสอบ functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('create_draft_from_version', 'duplicate_form');
```

---

### ขั้นที่ 5: ทดสอบการทำงาน

#### 5.1 ทดสอบที่หน้า Forms List
- [ ] แสดงรายการ forms ได้
- [ ] แสดง badge "มี Draft" (ถ้ามี)
- [ ] กดปุ่ม "คัดลอก" ได้ → สร้างฟอร์มใหม่
- [ ] กดปุ่ม "ประวัติ" ได้ → ไปหน้า history

#### 5.2 ทดสอบที่หน้า Edit Form (Tab Content)
- [ ] แก้ไขฟอร์มได้
- [ ] Auto-save ทำงาน (รอ 30 วินาที)
- [ ] กด "บันทึก Draft" ได้
- [ ] กด "Publish" ได้ → สร้าง version ใหม่

#### 5.3 ทดสอบที่หน้า Edit Form (Tab History)
- [ ] แสดงรายการ versions ได้
- [ ] กด "ดูตัวอย่าง" ได้
- [ ] กด "Revert" ได้ → สร้าง Draft
- [ ] กด "คัดลอก" จาก version เก่าได้

#### 5.4 ทดสอบ Duplicate
- [ ] กด "คัดลอก" จาก forms list
- [ ] ตั้งชื่อฟอร์มใหม่
- [ ] เลือก options (copy questions, settings, logo)
- [ ] กดสร้าง → redirect ไปหน้า edit ฟอร์มใหม่

#### 5.5 ทดสอบ Revert
- [ ] ไปที่ Tab History
- [ ] เลือก version เก่า
- [ ] กด "Revert กลับเวอร์ชันนี้"
- [ ] ยืนยัน → สร้าง Draft
- [ ] แก้ไข Draft ได้
- [ ] Publish → สร้าง version ใหม่

---

## 🐛 ปัญหาที่อาจเกิดขึ้นและวิธีแก้

### ปัญหา 1: Error "relation 'form_drafts' does not exist"
**สาเหตุ:** ตารางยังไม่ถูกสร้าง
**แก้ไข:** รันส่วนที่ 3 ของ migration อีกครั้ง

### ปัญหา 2: Error "function create_draft_from_version does not exist"
**สาเหตุ:** Function ยังไม่ถูกสร้าง
**แก้ไข:** รันส่วนที่ 4 ของ migration อีกครั้ง

### ปัญหา 3: ไม่เห็นข้อมูล forms (RLS Error)
**สาเหตุ:** Row Level Security บังคับใช้
**แก้ไข:** 
```sql
-- ตรวจสอบ RLS
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'forms';

-- ถ้า relrowsecurity = true ให้เพิ่ม policy
CREATE POLICY "Allow all" ON forms FOR ALL USING (true) WITH CHECK (true);
```

### ปัญหา 4: Draft ไม่ถูกบันทึก
**สาเหตุ:** RLS บน form_drafts
**แก้ไข:**
```sql
-- Disable RLS ชั่วคราวเพื่อทดสอบ
ALTER TABLE form_drafts DISABLE ROW LEVEL SECURITY;
```

### ปัญหา 5: Cannot revert to version (version not found)
**สาเหตุ:** ข้อมูลใน form_versions ไม่ครบ
**แก้ไข:**
```sql
-- ตรวจสอบว่ามี version นั้นจริง
SELECT * FROM form_versions WHERE form_id = 'FORM_ID' AND version = VERSION_NUMBER;
```

---

## 📊 ตารางสรุปการทำงาน

| ฟีเจอร์ | ไฟล์ที่เกี่ยวข้อง | สถานะ |
|---------|------------------|--------|
| Database Migration | `docs/migrations/001_add_version_history_and_draft.sql` | ⏳ รอรัน |
| Types | `src/types/index.ts` | ✅ เสร็จ |
| Hooks | `src/hooks/useFormVersions.ts` | ✅ เสร็จ |
| Hooks | `src/hooks/useFormDraft.ts` | ✅ เสร็จ |
| Hooks | `src/hooks/useDuplicateForm.ts` | ✅ เสร็จ |
| Version History UI | `src/components/VersionHistory.tsx` | ✅ เสร็จ |
| Duplicate Dialog | `src/components/DuplicateFormDialog.tsx` | ✅ เสร็จ |
| Edit Form Page | `src/app/admin/forms/[id]/EditFormPage.tsx` | ✅ เสร็จ |
| Forms List | `src/app/admin/forms/page.tsx` | ✅ เสร็จ |

---

## 🎯 สิ่งที่ต้องระวัง

1. **อย่ารัน migration ถ้า forms_count = 0** → ข้อมูลจะหายทั้งหมด
2. **Backup ก่อนรันเสมอ** → ถ้าผิดพลาดจะได้กู้คืน
3. **รันทีละส่วน** → ถ้าส่วนไหน error จะได้รู้และแก้ไข
4. **ทดสอบทันทีหลังรัน** → ถ้ามีปัญหาจะได้แก้เร็ว

---

## 📞 ติดต่อ/ขอความช่วยเหลือ

ถ้าพบปัญหาที่ไม่สามารถแก้ไขได้:
1. บันทึก error message
2. ถ่าย screenshot
3. ตรวจสอบว่า backup มีหรือไม่
4. ติดต่อผู้ดูแลระบบ

---

**หมายเหตุ:** ไฟล์ migration อยู่ที่ `docs/migrations/001_add_version_history_and_draft.sql`
# 📋 แผนการ Implement ฟีเจอร์ Version History + Draft + Duplicate

## ✅ สถานะปัจจุบัน

### สิ่งที่เสร็จแล้ว (Code)
- [x] Database Migration Script (`001_add_version_history_and_draft.sql`)
- [x] Type Definitions (`src/types/index.ts`)
- [x] Hooks (`useFormVersions`, `useFormDraft`, `useDuplicateForm`)
- [x] UI Components (`VersionHistory`, `DuplicateFormDialog`)
- [x] Edit Form Page แบบใหม่พร้อม Tabs
- [x] Forms List แบบใหม่พร้อม Action Menu

### สิ่งที่ยังไม่เสร็จ (ต้องทำต่อ)
- [ ] รัน Database Migration บน Supabase
- [ ] ตรวจสอบว่าไม่มีข้อมูลหาย
- [ ] ทดสอบการทำงานทุกฟีเจอร์
- [ ] แก้ไข Bugs ถ้าพบ

---

## 🔧 ขั้นตอนที่ต้องทำต่อ

### ขั้นที่ 1: ตรวจสอบข้อมูลก่อนรัน Migration (สำคัญ!)

ไปที่ **Supabase Dashboard → SQL Editor** แล้วรัน:

```sql
-- ตรวจสอบว่าข้อมูล forms ยังอยู่
SELECT COUNT(*) as forms_count FROM forms;

-- ตรวจสอบ form_versions
SELECT COUNT(*) as versions_count FROM form_versions;

-- ดูตัวอย่างข้อมูล
SELECT id, code, title, status, current_version 
FROM forms 
ORDER BY created_at DESC 
LIMIT 5;
```

**ถ้าผลลัพธ์เป็น:**
- `forms_count = 0` → ❌ อย่ารัน migration! ข้อมูลหายแล้ว ติดต่อผู้ดูแลระบบ
- `forms_count > 0` → ✅ ไปขั้นต่อไป

---

### ขั้นที่ 2: Backup ข้อมูล (สำคัญมาก!)

ก่อนรัน migration ต้อง backup:

#### วิธีที่ 1: Export จาก Supabase Dashboard
1. ไปที่ **Supabase Dashboard → Database → Backup**
2. กด **Create Backup** (ถ้ามีตัวเลือก)

#### วิธีที่ 2: Export ด้วย SQL
```sql
-- Export ข้อมูลสำคัญ
COPY (SELECT * FROM forms) TO '/tmp/forms_backup.csv' WITH CSV HEADER;
COPY (SELECT * FROM form_versions) TO '/tmp/versions_backup.csv' WITH CSV HEADER;
```

---

### ขั้นที่ 3: รัน Database Migration

#### 3.1 ไปที่ Supabase SQL Editor
1. เปิด [app.supabase.com](https://app.supabase.com)
2. เลือก Project ของคุณ
3. ไปที่ **SQL Editor** → **+ New Query**

#### 3.2 รันทีละส่วน (แนะนำ)

**ส่วนที่ 1: Update form_versions**
```sql
-- รันบรรทัดที่ 14-25 จากไฟล์ migration
ALTER TABLE form_versions 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS require_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consent_heading TEXT DEFAULT 'การยินยอม (Consent)',
ADD COLUMN IF NOT EXISTS consent_text TEXT,
ADD COLUMN IF NOT EXISTS consent_require_location BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_reverted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reverted_to_version INTEGER,
ADD COLUMN IF NOT EXISTS created_from_clone UUID REFERENCES forms(id);

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_form_versions_form_id_version 
ON form_versions(form_id, version DESC);
```

**ส่วนที่ 2: Update forms**
```sql
-- รันบรรทัดที่ 38-41
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS cloned_from UUID REFERENCES forms(id),
ADD COLUMN IF NOT EXISTS cloned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parent_form_id UUID REFERENCES forms(id);
```

**ส่วนที่ 3: Create form_drafts table**
```sql
-- รันบรรทัดที่ 54-147
CREATE TABLE IF NOT EXISTS form_drafts (
  -- ... (copy จากไฟล์ migration)
);

-- Enable RLS
ALTER TABLE form_drafts ENABLE ROW LEVEL SECURITY;

-- สร้าง policies
-- ...
```

**ส่วนที่ 4: Create Functions**
```sql
-- รันบรรทัดที่ 154-235 (create_draft_from_version)
-- รันบรรทัดที่ 237-353 (duplicate_form)
-- รันบรรทัดที่ 356-389 (trigger)
```

**ส่วนที่ 5: Backfill Data**
```sql
-- รันบรรทัดที่ 396-408
UPDATE form_versions fv
SET 
  title = f.title,
  description = f.description,
  logo_url = f.logo_url,
  require_consent = COALESCE(f.require_consent, FALSE),
  consent_heading = COALESCE(f.consent_heading, 'การยินยอม (Consent)'),
  consent_text = f.consent_text,
  consent_require_location = COALESCE(f.consent_require_location, FALSE),
  published_by = f.created_by
FROM forms f
WHERE fv.form_id = f.id
AND fv.version = f.current_version;
```

---

### ขั้นที่ 4: ตรวจสอบหลังรัน Migration

รัน SQL นี้เพื่อตรวจสอบ:

```sql
-- 1. ตรวจสอบว่า form_versions มีข้อมูลครบ
SELECT 
  version,
  title IS NOT NULL as has_title,
  published_by IS NOT NULL as has_publisher
FROM form_versions
LIMIT 5;

-- 2. ตรวจสอบว่า form_drafts ถูกสร้างแล้ว
SELECT COUNT(*) as draft_tables 
FROM information_schema.tables 
WHERE table_name = 'form_drafts';

-- 3. ตรวจสอบ functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('create_draft_from_version', 'duplicate_form');
```

---

### ขั้นที่ 5: ทดสอบการทำงาน

#### 5.1 ทดสอบที่หน้า Forms List
- [ ] แสดงรายการ forms ได้
- [ ] แสดง badge "มี Draft" (ถ้ามี)
- [ ] กดปุ่ม "คัดลอก" ได้ → สร้างฟอร์มใหม่
- [ ] กดปุ่ม "ประวัติ" ได้ → ไปหน้า history

#### 5.2 ทดสอบที่หน้า Edit Form (Tab Content)
- [ ] แก้ไขฟอร์มได้
- [ ] Auto-save ทำงาน (รอ 30 วินาที)
- [ ] กด "บันทึก Draft" ได้
- [ ] กด "Publish" ได้ → สร้าง version ใหม่

#### 5.3 ทดสอบที่หน้า Edit Form (Tab History)
- [ ] แสดงรายการ versions ได้
- [ ] กด "ดูตัวอย่าง" ได้
- [ ] กด "Revert" ได้ → สร้าง Draft
- [ ] กด "คัดลอก" จาก version เก่าได้

#### 5.4 ทดสอบ Duplicate
- [ ] กด "คัดลอก" จาก forms list
- [ ] ตั้งชื่อฟอร์มใหม่
- [ ] เลือก options (copy questions, settings, logo)
- [ ] กดสร้าง → redirect ไปหน้า edit ฟอร์มใหม่

#### 5.5 ทดสอบ Revert
- [ ] ไปที่ Tab History
- [ ] เลือก version เก่า
- [ ] กด "Revert กลับเวอร์ชันนี้"
- [ ] ยืนยัน → สร้าง Draft
- [ ] แก้ไข Draft ได้
- [ ] Publish → สร้าง version ใหม่

---

## 🐛 ปัญหาที่อาจเกิดขึ้นและวิธีแก้

### ปัญหา 1: Error "relation 'form_drafts' does not exist"
**สาเหตุ:** ตารางยังไม่ถูกสร้าง
**แก้ไข:** รันส่วนที่ 3 ของ migration อีกครั้ง

### ปัญหา 2: Error "function create_draft_from_version does not exist"
**สาเหตุ:** Function ยังไม่ถูกสร้าง
**แก้ไข:** รันส่วนที่ 4 ของ migration อีกครั้ง

### ปัญหา 3: ไม่เห็นข้อมูล forms (RLS Error)
**สาเหตุ:** Row Level Security บังคับใช้
**แก้ไข:** 
```sql
-- ตรวจสอบ RLS
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'forms';

-- ถ้า relrowsecurity = true ให้เพิ่ม policy
CREATE POLICY "Allow all" ON forms FOR ALL USING (true) WITH CHECK (true);
```

### ปัญหา 4: Draft ไม่ถูกบันทึก
**สาเหตุ:** RLS บน form_drafts
**แก้ไข:**
```sql
-- Disable RLS ชั่วคราวเพื่อทดสอบ
ALTER TABLE form_drafts DISABLE ROW LEVEL SECURITY;
```

### ปัญหา 5: Cannot revert to version (version not found)
**สาเหตุ:** ข้อมูลใน form_versions ไม่ครบ
**แก้ไข:**
```sql
-- ตรวจสอบว่ามี version นั้นจริง
SELECT * FROM form_versions WHERE form_id = 'FORM_ID' AND version = VERSION_NUMBER;
```

---

## 📊 ตารางสรุปการทำงาน

| ฟีเจอร์ | ไฟล์ที่เกี่ยวข้อง | สถานะ |
|---------|------------------|--------|
| Database Migration | `docs/migrations/001_add_version_history_and_draft.sql` | ⏳ รอรัน |
| Types | `src/types/index.ts` | ✅ เสร็จ |
| Hooks | `src/hooks/useFormVersions.ts` | ✅ เสร็จ |
| Hooks | `src/hooks/useFormDraft.ts` | ✅ เสร็จ |
| Hooks | `src/hooks/useDuplicateForm.ts` | ✅ เสร็จ |
| Version History UI | `src/components/VersionHistory.tsx` | ✅ เสร็จ |
| Duplicate Dialog | `src/components/DuplicateFormDialog.tsx` | ✅ เสร็จ |
| Edit Form Page | `src/app/admin/forms/[id]/EditFormPage.tsx` | ✅ เสร็จ |
| Forms List | `src/app/admin/forms/page.tsx` | ✅ เสร็จ |

---

## 🎯 สิ่งที่ต้องระวัง

1. **อย่ารัน migration ถ้า forms_count = 0** → ข้อมูลจะหายทั้งหมด
2. **Backup ก่อนรันเสมอ** → ถ้าผิดพลาดจะได้กู้คืน
3. **รันทีละส่วน** → ถ้าส่วนไหน error จะได้รู้และแก้ไข
4. **ทดสอบทันทีหลังรัน** → ถ้ามีปัญหาจะได้แก้เร็ว

---

## 📞 ติดต่อ/ขอความช่วยเหลือ

ถ้าพบปัญหาที่ไม่สามารถแก้ไขได้:
1. บันทึก error message
2. ถ่าย screenshot
3. ตรวจสอบว่า backup มีหรือไม่
4. ติดต่อผู้ดูแลระบบ

---

## 📝 Progress Tracker (อัพเดทตามความคืบหน้า)

> **วันที่เริ่ม:** ___________
> **คนทำ:** ___________
> **สถานะล่าสุด:** ___________

### ⏸️ จุดที่ Pause (ถ้าหยุดกลางคัน)
- [ ] หยุดที่ขั้นตอนที่: ___________
- [ ] เหตุผล: ___________
- [ ] Error ที่เจอ (ถ้ามี): ___________
- [ ] ข้อควรจำตอนกลับมาทำต่อ: ___________

### ✅ Checklist ความคืบหน้า

#### Phase 1: Database (⏳ รอทำ)
- [ ] ตรวจสอบ forms_count
- [ ] Backup ข้อมูล
- [ ] รัน Part 1: Update form_versions
- [ ] รัน Part 2: Update forms
- [ ] รัน Part 3: Create form_drafts
- [ ] รัน Part 4: Create functions
- [ ] รัน Part 5: Backfill data
- [ ] ตรวจสอบหลังรัน

**หมายเหตุ Phase 1:** ___________

#### Phase 2: Testing (⏳ รอทำ)
- [ ] ทดสอบ Forms List
- [ ] ทดสอบ Edit Form - Content Tab
- [ ] ทดสอบ Edit Form - Settings Tab
- [ ] ทดสอบ Edit Form - History Tab
- [ ] ทดสอบ Duplicate
- [ ] ทดสอบ Revert

**หมายเหตุ Phase 2:** ___________

#### Phase 3: Bug Fixes (⏳ รอทำ)
- [ ] แก้ไขปัญหาที่พบใน Phase 1
- [ ] แก้ไขปัญหาที่พบใน Phase 2
- [ ] ทดสอบอีกครั้งหลังแก้ไข

**หมายเหตุ Phase 3:** ___________

### 🐛 Bugs Log (บันทึกปัญหาที่พบ)

| # | วันที่ | ปัญหา | วิธีแก้ | สถานะ |
|---|--------|--------|---------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### 💡 Notes (บันทึกเพิ่มเติม)

_______________________________________________

_______________________________________________

_______________________________________________

---

**หมายเหตุ:** ไฟล์ migration อยู่ที่ `docs/migrations/001_add_version_history_and_draft.sql`

**อัพเดทล่าสุด:** ___________
