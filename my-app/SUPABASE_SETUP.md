# คู่มือเชื่อมต่อ Supabase

## ขั้นตอนที่ 1: สร้าง Project ใน Supabase

1. ไปที่ https://supabase.com และสร้าง account
2. สร้าง New Project
3. ตั้งชื่อ project และรอสร้างเสร็จ

## ขั้นตอนที่ 2: ดึง Credentials

ไปที่ Project Settings → API:
- **Project URL** → ใส่ใน `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → ใส่ใน `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role secret** → ใส่ใน `SUPABASE_SERVICE_ROLE_KEY`

## ขั้นตอนที่ 3: ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ `my-app`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ขั้นตอนที่ 4: สร้างตารางใน Supabase

ไปที่ SQL Editor → New Query แล้ววางโค้ดจาก `supabase/migrations/001_initial_schema.sql`:

```sql
-- รัน migration ทั้งหมด
-- ไฟล์อยู่ที่: supabase/migrations/001_initial_schema.sql
```

หรือใช้ Supabase CLI:
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

## ขั้นตอนที่ 5: เปิดใช้งาน Authentication (ถ้าต้องการ)

ไปที่ Authentication → Providers → Email → เปิดใช้งาน

## โครงสร้าง Database

### ตารางหลัก

| ตาราง | คำอธิบาย |
|-------|---------|
| `projects` | เก็บข้อมูลโครงการ (code, name) |
| `forms` | เก็บแบบสอบถาม (fields เป็น JSONB) |
| `qr_codes` | เก็บ QR Code (เชื่อม form + project) |
| `submissions` | เก็บคำตอบ (responses เป็น JSONB) |

### Views สำหรับ Analytics

| View | คำอธิบาย |
|------|---------|
| `analytics_utm_summary` | สรุป UTM sources |
| `analytics_qr_performance` | สรุป QR Code performance |
| `analytics_project_summary` | สรุปตามโครงการ |

## ตัวอย่างข้อมูล

### สร้าง Project ตัวอย่าง

```sql
INSERT INTO projects (code, name, description) VALUES
('BGHBK', 'ซื่อป้าสี่ บางแค', 'โครงการบางแค'),
('BN3', 'นิช โมโน บางนา', 'โครงการบางนา');
```

### สร้าง Form ตัวอย่าง

```sql
INSERT INTO forms (code, slug, title, description, fields) VALUES
('FRM-001', 'satisfaction-survey', 'แบบสอบถามความพึงพอใจ', 'ช่วยเราปรับปรุงบริการ', '[
  {"id": "q1", "type": "text", "label": "ชื่อ-นามสกุล", "required": true},
  {"id": "q2", "type": "rating", "label": "ความพึงพอใจ", "min": 1, "max": 5}
]'::jsonb);
```

### สร้าง QR Code ตัวอย่าง

```sql
INSERT INTO qr_codes (form_id, project_id, name, qr_slug, utm_source, utm_medium) 
SELECT 
  f.id as form_id,
  p.id as project_id,
  'FRM-001-BGHBK' as name,
  'frm-001-bghbk' as qr_slug,
  p.name as utm_source,
  p.code as utm_medium
FROM forms f, projects p
WHERE f.code = 'FRM-001' AND p.code = 'BGHBK';
```

## ทดสอบการเชื่อมต่อ

```bash
cd my-app
npm run dev
```

เข้าไปที่ http://localhost:3000/admin/forms

## แก้ไขปัญหาเบื้องต้น

### CORS Error
ไปที่ Supabase → API Settings → Enable CORS → เพิ่ม `http://localhost:3000`

### RLS Policy Error
ตรวจสอบว่าเปิดใช้งาน RLS และสร้าง Policy ถูกต้อง

### ไม่สามารถเข้าถึงข้อมูลได้
ตรวจสอบ environment variables ว่าตั้งค่าถูกต้อง
