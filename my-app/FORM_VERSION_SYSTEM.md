# ระบบ Form Version - การนับ Version และตรวจจับการเปลี่ยนแปลง

## หลักการทำงาน

```
┌─────────────────────────────────────────────────────────────┐
│                    การนับ Version                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  สร้างฟอร์มใหม่ ──▶ Version 1 (current_version = 1)        │
│       │                                                     │
│       ▼                                                     │
│  แก้ไขครั้งที่ 1 ──▶ เปรียบเทียบกับ v1 ──▶ มีการเปลี่ยน?   │
│       │                              │                      │
│       │                              └──▶ ใช่ ──▶ Version 2 │
│       │                                     current_version++
│       │                                                     │
│       ▼                                                     │
│  แก้ไขครั้งที่ 2 ──▶ เปรียบเทียบกับ v2 ──▶ มีการเปลี่ยน?   │
│                                            └──▶ ใช่ ──▶ Version 3
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## วิธีตรวจจับการเปลี่ยนแปลง (Change Detection)

### 1. Hash Comparison (แนะนำ)

```typescript
import { createHash } from 'crypto';

// สร้าง hash จาก fields
function generateFieldsHash(fields: FormField[]): string {
  const fieldsString = JSON.stringify(fields);
  return createHash('md5').update(fieldsString).digest('hex');
  // ผลลัพธ์: "a3f5c8d2e1b4..." (32 ตัวอักษร)
}

// ตอนบันทึกฟอร์ม
async function saveForm(formId: string, newFields: FormField[]) {
  const supabase = getSupabaseBrowser();
  
  // 1. ดึงฟอร์มปัจจุบัน
  const { data: currentForm } = await supabase
    .from('forms')
    .select('fields_hash, current_version')
    .eq('id', formId)
    .single();
  
  // 2. สร้าง hash ใหม่
  const newHash = generateFieldsHash(newFields);
  
  // 3. เปรียบเทียบ
  if (newHash !== currentForm.fields_hash) {
    // มีการเปลี่ยนแปลง!
    const newVersion = currentForm.current_version + 1;
    
    // 4. บันทึก version ใหม่
    await supabase.from('form_versions').insert({
      form_id: formId,
      version: newVersion,
      fields: newFields,
      fields_hash: newHash,
    });
    
    // 5. อัพเดทฟอร์มหลัก
    await supabase.from('forms').update({
      fields: newFields,
      fields_hash: newHash,
      current_version: newVersion,
      updated_at: new Date().toISOString(),
    }).eq('id', formId);
    
    return { version: newVersion, isChanged: true };
  }
  
  return { version: currentForm.current_version, isChanged: false };
}
```

### 2. Deep Compare (เปรียบเทียบโครงสร้าง)

```typescript
function hasFieldsChanged(oldFields: FormField[], newFields: FormField[]): boolean {
  // เปรียบเทียบจำนวน
  if (oldFields.length !== newFields.length) return true;
  
  // เปรียบเทียบแต่ละ field
  for (let i = 0; i < oldFields.length; i++) {
    const oldField = oldFields[i];
    const newField = newFields[i];
    
    // เช็ค id, type, label, options, etc.
    if (oldField.id !== newField.id) return true;
    if (oldField.type !== newField.type) return true;
    if (oldField.label !== newField.label) return true;
    if (JSON.stringify(oldField.options) !== JSON.stringify(newField.options)) return true;
    if (oldField.required !== newField.required) return true;
  }
  
  return false;
}
```

---

## Database Schema

```sql
-- ตาราง forms เพิ่มฟิลด์
ALTER TABLE forms ADD COLUMN current_version INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN fields_hash VARCHAR(32);  -- MD5 hash

-- ตารางเก็บประวัติ version
CREATE TABLE form_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    fields JSONB NOT NULL,
    fields_hash VARCHAR(32) NOT NULL,
    change_summary TEXT,  -- อธิบายสั้นๆ ว่าแก้อะไร (auto หรือ manual)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(form_id, version)
);

-- Index
CREATE INDEX idx_form_versions_form_version ON form_versions(form_id, version);
CREATE INDEX idx_form_versions_hash ON form_versions(fields_hash);

-- ตาราง submissions เพิ่ม version
ALTER TABLE submissions ADD COLUMN form_version INTEGER DEFAULT 1;
```

---

## Flow การทำงานเต็ม

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin กด "บันทึก" ใน Form Builder                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. ดึงข้อมูลฟอร์มปัจจุบัน                                       │
│     SELECT fields, current_version, fields_hash FROM forms      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. สร้าง hash จาก fields ใหม่                                  │
│     newHash = md5(JSON.stringify(newFields))                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. เปรียบเทียบ hash                                            │
│     IF newHash != oldHash ──▶ มีการเปลี่ยนแปลง                  │
│     ELSE ──▶ ไม่มีการเปลี่ยนแปลง (บันทึกทับปกติ)               │
└─────────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
   ┌─────────────────┐             ┌─────────────────┐
   │  ไม่มีการเปลี่ยน │             │   มีการเปลี่ยน   │
   │  แค่บันทึกทับ    │             │                 │
   │                 │             │  1. newVersion =  │
   │  UPDATE forms   │             │     current + 1   │
   │  SET fields =   │             │                 │
   │      newFields  │             │  2. INSERT INTO   │
   │                 │             │     form_versions │
   └─────────────────┘             │                 │
                                   │  3. UPDATE forms  │
                                   │     SET fields,   │
                                   │     current_      │
                                   │     version = new │
                                   └─────────────────┘
```

---

## ตัวอย่างข้อมูล

### forms table
```sql
id        | title                  | fields | current_version | fields_hash
----------|------------------------|--------|-----------------|-------------
form-001  | แบบสอบถามความพึงพอใจ | [...]  | 3               | a3f5c8d2...
```

### form_versions table
```sql
form_id   | version | fields                     | fields_hash  | created_at
----------|---------|----------------------------|--------------|-------------
form-001  | 1       | [{"id": "q1", "label": "ชื่อ"}] | 8b2e1f4a...  | 2024-01-01
form-001  | 2       | [{"id": "q1", "label": "ชื่อ-นามสกุล"}] | d7c9a3b1...  | 2024-01-10
form-001  | 3       | [{"id": "q1", "label": "ชื่อ-นามสกุล"}, {"id": "q2"...}] | a3f5c8d2...  | 2024-01-15
```

### submissions table
```sql
id       | form_id  | form_version | responses           | submitted_at
---------|----------|--------------|---------------------|-------------
sub-001  | form-001 | 1            | {"q1": "สมชาย"}      | 2024-01-05
sub-002  | form-001 | 1            | {"q1": "สมหญิง"}     | 2024-01-08
sub-003  | form-001 | 2            | {"q1": "สมหมาย"}     | 2024-01-12
sub-004  | form-001 | 3            | {"q1": "สมปอง"}      | 2024-01-20
```

---

## การ Query ข้อมูลพร้อมคำถามตรง Version

```sql
-- ดึง submission พร้อมคำถามตรง version
SELECT 
    s.id,
    s.submitted_at,
    s.form_version,
    fv.fields as questions_at_that_time,  -- คำถามตอนนั้น
    s.responses as answers
FROM submissions s
JOIN form_versions fv 
    ON s.form_id = fv.form_id 
    AND s.form_version = fv.version
WHERE s.form_id = 'form-001'
ORDER BY s.submitted_at DESC;
```

**ผลลัพธ์:**
| id | submitted_at | version | questions_at_that_time | answers |
|----|-------------|---------|------------------------|---------|
| sub-004 | 2024-01-20 | 3 | [{"label": "ชื่อ-นามสกุล"}...] | {"q1": "สมปอง"} |
| sub-001 | 2024-01-05 | 1 | [{"label": "ชื่อ"}] | {"q1": "สมชาย"} |

**✅ คำถามตรงกับตอนส่งแน่นอน!**

---

## UI ที่ควรมี

### 1. แสดง Version ใน Admin
```
แบบสอบถาม: แบบสอบถามความพึงพอใจ
เวอร์ชันปัจจุบัน: v3 (อัพเดทล่าสุด: 15 ม.ค. 2024)

ประวัติการแก้ไข:
• v3 (15 ม.ค.) - เพิ่มคำถาม "อีเมล"
• v2 (10 ม.ค.) - แก้ "ชื่อ" เป็น "ชื่อ-นามสกุล"
• v1 (1 ม.ค.) - สร้างแบบสอบถาม
```

### 2. Export แยกตาม Version
```
ดาวน์โหลดข้อมูล:
[ทั้งหมด] [v1 เท่านั้น] [v2 เท่านั้น] [v3 เท่านั้น]
```

---

## สรุปข้อดีของระบบ Version

| ข้อดี | คำอธิบาย |
|-------|---------|
| ประหยัดเนื้อที่ | เก็บแค่ตอนเปลี่ยน ไม่ใช่ทุก submission |
| ย้อนกลับได้ | ดูประวัติการแก้ไขทั้งหมด |
| ข้อมูลถูกต้อง | คำถามตรงกับตอนส่งแน่นอน |
| Export ง่าย | รู้ว่าแต่ละช่วงมีคำถามอะไร |

ต้องการให้ implement ระบบนี้ไหมครับ? หรืออยากให้ทำตัวอย่าง code เต็มๆ?
