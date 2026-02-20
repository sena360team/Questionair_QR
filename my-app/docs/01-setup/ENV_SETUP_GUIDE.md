# คู่มือตั้งค่า .env.local

## ขั้นตอนที่ 1: เข้า Supabase Dashboard

1. ไปที่ https://supabase.com
2. Sign in เข้าบัญชีของคุณ
3. เลือก Project ที่สร้างไว้

```
┌─────────────────────────────────────────────────────────────┐
│  Supabase Dashboard                                         │
│                                                             │
│  Projects ▼                                                 │
│  ├─ questionnaire-qr   ← คลิกอันนี้                        │
│  └─ other-project                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## ขั้นตอนที่ 2: ไปที่ API Settings

1. มองหาไอคอน **⚙️ (เฟือง)** ด้านล่างซ้าย
2. คลิก **"Project Settings"**
3. คลิก **"API"** จากเมนูด้านซ้าย

```
┌─────────────────────────────────────────────────────────────┐
│  Project Settings                                           │
│                                                             │
│  ┌─────────────────┐                                        │
│  │ General         │                                        │
│  │ Database        │                                        │
│  │ API     ←───────┼── คลิกตรงนี้                          │
│  │ Authentication  │                                        │
│  │ Storage         │                                        │
│  └─────────────────┘                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## ขั้นตอนที่ 3: ก็อปค่าต่างๆ

หน้า API จะมีข้อมูลแบบนี้:

```
┌─────────────────────────────────────────────────────────────┐
│  API Settings                                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Project URL                                         │    │
│  │ https://abc123xyz.supabase.co  ← ก็อปตัวนี้         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Project API keys                                    │    │
│  │                                                     │    │
│  │ anon public                                          │    │
│  │ ••••••••••••••  [Reveal]  ← กดเพื่อโชว์           │    │
│  │ eyJhbGciOiJIUzI1NiIs...  ← ก็อปตัวนี้              │    │
│  │                                                     │    │
│  │ service_role secret                                 │    │
│  │ ••••••••••••••  [Reveal]  ← กดเพื่อโชว์           │    │
│  │ eyJhbGciOiJIUzI1NiIs...  ← ก็อปตัวนี้              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## ขั้นตอนที่ 4: วางลงใน .env.local

เปิดไฟล์ `.env.local` (ที่สร้างให้แล้ว) และแทนที่ค่า:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abc123xyz.supabase.co
                         └─ ใส่ของคุณตรงนี้

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
                               └─ ใส่ของคุณตรงนี้

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
                            └─ ใส่ของคุณตรงนี้
```

## ตัวอย่างที่ถูกต้อง

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnopqrstuvwxyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQwNjA4MDAsImV4cCI6MjAxOTYzNjgwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNDA2MDgwMCwiZXhwIjoyMDE5NjM2ODAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ขั้นตอนที่ 5: รันโปรเจค

```bash
cd my-app
npm run dev
```

แล้วไปที่ http://localhost:3000/admin

## ถ้าใช้งานได้จะเห็น

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                                  │
│  ภาพรวมระบบแบบสอบถามของคุณ                                  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ แบบสอบถาม │  │ QR Codes │  │คำตอบรวม │  │ วันนี้   │    │
│  │    0     │  │    0     │  │    0     │  │    0     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
│  (ไม่ error = ใช้ได้!)                                     │
└─────────────────────────────────────────────────────────────┘
```

## ปัญหาที่พบบ่อย

### ❌ Error: "Invalid URL"
- ตรวจสอบว่าใส่ `https://` ด้วยหรือยัง
- ตรวจสอบว่าไม่มีช่องว่างหรือตัวอักษรพิเศษ

### ❌ Error: "Invalid API key"
- ตรวจสอบว่าไม่ได้เอา `service_role` มาใส่ใน `ANON_KEY`
- ตรวจสอบว่า copy ครบทั้งหมด (ขึ้นต้นด้วย eyJ...)

### ❌ Error: "JWT expired"
- สร้าง project ใหม่หรือ regenerate key
- ไปที่ Project Settings → API → Regenerate keys

---

**ถ้ายังไม่ได้ ส่ง error มาให้ดูได้เลยครับ!** 🚀
