# คู่มือการดึงข้อมูลไปใช้งานต่อ

## โครงสร้างข้อมูลสำคัญ

```
forms.fields = [
  { "id": "q1", "type": "text", "label": "ชื่อ-นามสกุล" },
  { "id": "q2", "type": "rating", "label": "คะแนนความพึงพอใจ" }
]

submissions.responses = {
  "q1": "สมชาย ใจดี",
  "q2": 5
}
```

**หลักการ:** คำถามอยู่ใน `forms` / คำตอบอยู่ใน `submissions` / เชื่อมโยงด้วย `field.id`

---

## การ Query ข้อมูล

### 1. ดึงข้อมูลพร้อมคำถาม (Supabase SQL)

```sql
-- ดึง submissions พร้อมคำถามจากฟอร์ม
SELECT 
    s.id as submission_id,
    s.submitted_at,
    f.id as form_id,
    f.title as form_title,
    f.fields as questions,        -- JSON ของคำถามทั้งหมด
    s.responses as answers,       -- JSON ของคำตอบ
    s.consent_given,
    s.consented_at,
    s.consent_ip,
    s.consent_location
FROM submissions s
JOIN forms f ON s.form_id = f.id
WHERE f.id = 'your-form-id'
ORDER BY s.submitted_at DESC;
```

### 2. ดึงข้อมูลแบบ Flat (สำหรับ Excel Export)

```sql
-- ตัวอย่าง: ฟอร์มมีคำถาม q1=ชื่อ, q2=คะแนน
SELECT 
    s.id,
    s.submitted_at,
    f.title as form_title,
    s.responses->>'q1' as name,           -- ชื่อ
    s.responses->>'q2' as score,          -- คะแนน
    s.responses->>'q3' as email,          -- อีเมล (ถ้ามี)
    s.utm_source,
    s.utm_campaign,
    s.consent_given,
    s.consent_ip
FROM submissions s
JOIN forms f ON s.form_id = f.id
WHERE f.id = 'your-form-id';
```

### 3. ใช้ใน JavaScript/TypeScript

```typescript
import { getSupabaseBrowser } from '@/lib/supabase';

// ดึงข้อมูลพร้อมคำถาม
async function exportFormData(formId: string) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      form:forms(id, title, fields)
    `)
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false });
    
  if (error) throw error;
  
  // แปลงข้อมูลให้อ่านง่าย
  const formatted = data.map(sub => {
    const questions = sub.form.fields;
    const answers = sub.responses;
    
    // สร้าง object ที่มีคำถามเป็นชื่อ column
    const row: Record<string, any> = {
      'วันที่ส่ง': sub.submitted_at,
      'แบบสอบถาม': sub.form.title,
    };
    
    // เพิ่มคำถามแต่ละข้อเป็น column
    questions.forEach((q: any) => {
      if (q.type !== 'heading' && q.type !== 'section') {
        row[q.label] = answers[q.id] || '-';
      }
    });
    
    // Consent data
    row['ยินยอม'] = sub.consent_given ? 'ใช่' : 'ไม่';
    row['IP'] = sub.consent_ip;
    
    return row;
  });
  
  return formatted;
}

// ใช้งาน
const data = await exportFormData('form-001');
console.table(data);
```

---

## กรณีที่คำถามเปลี่ยน (สำคัญ!)

### สถานการณ์
1. วันที่ 1: สร้างฟอร์มมีคำถาม q1="ชื่อ"
2. วันที่ 5: มี 10 คนตอบ → เก็บ responses={q1: "สมชาย"...}
3. วันที่ 10: แก้ฟอร์ม q1 เป็น "ชื่อ-นามสกุล" 
4. วันที่ 15: มี 5 คนตอบ → เก็บ responses={q1: "สมหญิง สวยงาม"...}

### ผลที่เกิด
```javascript
// ข้อมูลที่ดึงมา
[
  { submitted_at: "วันที่ 15", q1: "สมหญิง สวยงาม", question_label: "ชื่อ-นามสกุล" },
  { submitted_at: "วันที่ 5",  q1: "สมชาย",        question_label: "ชื่อ-นามสกุล" }  // ❌ คำถามตอนนั้นคือ "ชื่อ"
]
```

**ปัญหา:** คำถามเก่าถูกเขียนทับ แต่คำตอบยังอยู่

---

## วิธีแก้ปัญหา (แนะนำ)

### วิธีที่ 1: เก็บ snapshot คำถามตอนส่ง (ยังไม่ได้ทำ)

```sql
-- เพิ่ม column ใน submissions
ALTER TABLE submissions ADD COLUMN fields_snapshot JSONB;

-- ตอนส่งบันทึกคำถามด้วย
INSERT INTO submissions (form_id, responses, fields_snapshot)
VALUES ('form-001', '{"q1": "สมชาย"}', '[{"id": "q1", "label": "ชื่อ"}]');
```

### วิธีที่ 2: สร้างฟอร์มใหม่แทนการแก้ไข (แนะนำ)

แทนที่จะแก้ฟอร์มเก่า:
1. สร้างฟอร์มใหม่ (v2)
2. Gen QR ใหม่
3. เก็บข้อมูลแยกกัน

### วิธีที่ 3: Export ก่อนแก้ไข

1. Export ข้อมูลเก่าออกเป็น Excel/CSV
2. แก้ไขฟอร์ม
3. ข้อมูลใหม่จะมีโครงสร้างตามฟอร์มใหม่

---

## สรุป

| คำถาม | คำตอบ |
|-------|--------|
| หาเจอไหม? | ✅ เจอ ใน `forms.fields` |
| ตรงกับตอนนั้นไหม? | ⚠️ อาจไม่ตรง ถ้ามีการแก้ไขฟอร์ม |
| ควรทำยังไง? | Export ก่อนแก้ หรือ สร้างฟอร์มใหม่ |

---

## ตัวอย่าง Export เป็น Excel

```typescript
import * as XLSX from 'xlsx';

async function exportToExcel(formId: string) {
  const data = await exportFormData(formId);
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Submissions');
  
  XLSX.writeFile(wb, `form-export-${formId}.xlsx`);
}
```

ต้องการให้เพิ่มฟังก์ชัน **Export ข้อมูล** ในระบบไหมครับ? (ปุ่มดาวน์โหลด Excel)
