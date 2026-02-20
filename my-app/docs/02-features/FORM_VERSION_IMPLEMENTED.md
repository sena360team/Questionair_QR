# ✅ Form Version System - สรุปการ Implement

## ระบบที่สร้างแล้ว

### 1. Database Schema (`003_form_version_system.sql`)

```sql
forms
├── status: 'draft' | 'published' | 'archived'
├── current_version: number (0 = ยังไม่ publish)
├── fields_hash: MD5 hash
└── published_at: timestamp

form_versions (เก็บประวัติ)
├── form_id
├── version: 1, 2, 3...
├── fields: JSONB (คำถามตอนนั้น)
├── fields_hash
└── change_summary

submissions
├── form_version: number (version ตอนส่ง)
```

### 2. Functions ใน Database

| Function | คำอธิบาย |
|----------|---------|
| `publish_form()` | Publish ครั้งแรก สร้าง v1 |
| `create_new_version()` | สร้าง v2, v3... หลัง publish |
| `generate_fields_hash()` | สร้าง MD5 hash |

### 3. Views

| View | คำอธิบาย |
|------|---------|
| `submissions_with_questions` | ดึงคำตอบพร้อมคำถามตรง version |
| `form_version_summary` | สรุป version ของแต่ละฟอร์ม |

---

## Workflow การใช้งาน

### สร้างฟอร์มใหม่
```
1. กรอกข้อมูล → กด "บันทึก Draft" หรือ "Publish v1"
   
   [บันทึก Draft] → status='draft', current_version=0
   [Publish v1]   → status='published', current_version=1
                         ↓
                    สร้าง record ใน form_versions (v1)
```

### แก้ไขฟอร์มที่ Published
```
ฟอร์ม v1 (มีคนตอบแล้ว)
    ↓ แก้ไข
กด "บันทึกเป็น v2"
    ↓
current_version=2
สร้าง record ใน form_versions (v2)
QR Code เดิมใช้ได้ต่อ (ชี้มาที่ฟอร์มเดิม)
```

### ผู้ใช้กรอกฟอร์ม
```
ผู้ใช้สแกน QR → เปิดฟอร์มล่าสุด (v2)
    ↓ กรอก + ส่ง
บันทึก submissions.form_version = 2
```

---

## การดึงข้อมูล (Query)

### ดึงคำตอบพร้อมคำถามตรง version
```sql
SELECT 
    s.submitted_at,
    s.form_version,
    s.responses,
    fv.fields as questions_at_that_time
FROM submissions s
JOIN form_versions fv 
    ON s.form_id = fv.form_id 
    AND s.form_version = fv.version
WHERE s.form_id = 'form-001';
```

### ดึงจาก View (สำเร็จรูป)
```sql
SELECT * FROM submissions_with_questions 
WHERE form_id = 'form-001';
```

---

## ข้อดีของระบบนี้

| ข้อดี | อธิบาย |
|-------|--------|
| ✅ QR ไม่ต้องเปลี่ยน | ชี้มาที่ฟอร์มเดิมตลอด |
| ✅ เรียกข้อมูลได้ตลอด | คำถามตรง version เก็บไว้ครบ |
| ✅ ประหยัดเนื้อที่ | เก็บแค่ตอน publish/แก้ ไม่ใช่ทุก draft |
| ✅ ไม่สับสน | Version เริ่มที่ 1 ตอน publish |
| ✅ ย้อนกลับได้ | ดูประวัติทุก version |

---

## ตัวอย่างข้อมูลจริง

### forms
```
id: form-001
code: FRM-001
title: แบบสอบถามความพึงพอใจ
status: published
current_version: 3
fields_hash: a3f5c8d2...
```

### form_versions
```
form_id   | version | fields                          | published_at
----------|---------|---------------------------------|-------------
form-001  | 1       | [{"id":"q1","label":"ชื่อ"}]     | 2024-01-01
form-001  | 2       | [{"id":"q1","label":"ชื่อ-สกุล"}] | 2024-01-10
form-001  | 3       | [{"id":"q1","label":"ชื่อ-สกุล"}, {"id":"q2"...}] | 2024-01-15
```

### submissions
```
id       | form_id  | version | responses           | submitted_at
---------|----------|---------|---------------------|-------------
sub-001  | form-001 | 1       | {"q1":"สมชาย"}      | 2024-01-05  ← ถาม "ชื่อ"
sub-002  | form-001 | 2       | {"q1":"สมหญิง สวย"} | 2024-01-12  ← ถาม "ชื่อ-สกุล"
sub-003  | form-001 | 3       | {"q1":"สมปอง"}      | 2024-01-20  ← ถาม "ชื่อ-สกุล" + มี q2
```

**ผลลัพธ์:**
- sub-001: ตอบตอนที่คำถามเป็น "ชื่อ" (v1)
- sub-002: ตอบตอนที่คำถามเป็น "ชื่อ-สกุล" (v2)
- sub-003: ตอบตอนที่มีคำถาม q1+q2 (v3)

✅ **ข้อมูลถูกต้องตามเวลาที่ส่งแน่นอน!**

---

## ขั้นตอนถัดไป (ถ้าต้องการ)

1. **หน้า Edit Form** - เพิ่มปุ่ม "บันทึกเป็น vX" สำหรับฟอร์มที่ publish แล้ว
2. **หน้า Form List** - แสดงสถานะ draft/published + version
3. **Export Excel** - ดึงข้อมูลตาม version
4. **Preview Version** - ดูตัวอย่างฟอร์มย้อนหลัง

ต้องการให้ทำอันไหนเพิ่มไหมครับ?
