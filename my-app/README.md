# Questionnaire QR System

ระบบแบบสอบถามออนไลน์ พร้อม Dynamic QR Code และ UTM Tracking

## ✨ Features

- 📝 **Form Builder** - สร้างแบบสอบถามด้วย Drag & Drop รองรับหลายประเภทคำถาม
- 📱 **Dynamic QR Code** - สร้าง QR Code ที่เปลี่ยนลิงก์ปลายทางได้โดยไม่ต้องพิมพ์ใหม่
- 📊 **UTM Tracking** - ติดตามแหล่งที่มาของผู้ตอบแบบละเอียด
- 🎨 **CMS Dashboard** - จัดการฟอร์มและดู Analytics ครบวงจร
- 🗄️ **Supabase** - Database แบบ Real-time

## 🚀 Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Charts**: Recharts

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # CMS Dashboard
│   │   ├── form/[slug]/        # Public Form Page
│   │   ├── qr/[slug]/          # QR Code Redirect Service
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Landing Page
│   │   └── globals.css
│   ├── components/             # React Components
│   │   ├── FormBuilder.tsx     # Form Builder UI
│   │   ├── FormRenderer.tsx    # Form Display
│   │   ├── QRGenerator.tsx     # QR Code Generator
│   │   └── Analytics.tsx       # Analytics Dashboard
│   ├── hooks/                  # Custom React Hooks
│   │   └── useSupabase.ts
│   ├── lib/                    # Utilities
│   │   ├── supabase.ts         # Supabase Client
│   │   ├── utm.ts              # UTM Tracking
│   │   ├── qr.ts               # QR Code Generation
│   │   └── utils.ts
│   └── types/                  # TypeScript Types
│       ├── index.ts
│       └── supabase.ts
├── supabase/
│   └── migrations/             # Database Migrations
└── package.json
```

## 🛠️ Setup & Installation

### 1. ติดตั้ง Dependencies

```bash
cd my-app
npm install
```

### 2. ตั้งค่า Supabase

1. สร้าง Project ใหม่ที่ [Supabase](https://supabase.com)
2. รัน SQL Migration:
   - ไปที่ SQL Editor
   - เปิดไฟล์ `supabase/migrations/001_initial_schema.sql`
   - คัดลอกและรัน SQL

3. หรือใช้ Supabase CLI:
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 3. ตั้งค่า Environment Variables

```bash
cp .env.example .env.local
```

แก้ไข `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. รัน Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## 📱 วิธีใช้งาน

### 1. สร้างแบบสอบถาม
1. ไปที่ `/admin`
2. คลิก "สร้างแบบสอบถาม"
3. ออกแบบฟอร์มด้วย Form Builder
4. บันทึก

### 2. สร้าง QR Code
1. เลือกแบบสอบถามจากรายการ
2. คลิก "สร้าง QR Code"
3. ตั้งค่า:
   - **ชื่อ QR Code**: เช่น "สาขาสยาม", "Event มกราคม"
   - **UTM Content**: ใช้แยกตำแหน่ง เช่น "table-5", "counter-a"
4. ดาวน์โหลด QR Code
5. พิมพ์และวางตามจุดต่างๆ

### 3. ดู Analytics
1. ไปที่ `/admin/analytics`
2. ดูข้อมูล:
   - จำนวนสแกน QR Code
   - จำนวนคำตอบ
   - Conversion Rate
   - แหล่งที่มา (UTM Source)
   - ตำแหน่งที่ได้รับคำตอบมากที่สุด (UTM Content)

## 🔗 URL Structure

| Path | Description |
|------|-------------|
| `/` | Landing Page |
| `/admin` | CMS Dashboard |
| `/admin/analytics` | Analytics Report |
| `/form/[slug]` | Public Form |
| `/qr/[slug]` | QR Code Redirect Service |

## 📊 UTM Tracking

ระบบรองรับ UTM Parameters ทั้งหมด:

- `utm_source` - แหล่งที่มา (เช่น qr_code, facebook)
- `utm_medium` - ช่องทาง (เช่น offline, social)
- `utm_campaign` - ชื่อแคมเปญ
- `utm_content` - **ใช้แยกตำแหน่ง/สาขา** (เช่น table-5, counter-a)
- `utm_term` - คีย์เวิร์ด

### ตัวอย่างการใช้งาน:

```
# QR Code ที่สาขาสยาม
/qr/branch-siam?utm_content=siam-paragon

# QR Code ที่โต๊ะ 5
/qr/restaurant-survey?utm_content=table-5

# QR Code ที่ Event
/qr/event-2024?utm_campaign=new-year-2024&utm_content=booth-a
```

## 🔧 Dynamic QR Code

ฟีเจอร์นี้ช่วยให้คุณสามารถ:
- เปลี่ยนลิงก์ปลายทางของ QR Code ได้โดยไม่ต้องพิมพ์ QR ใหม่
- สร้าง QR Code หลายตัวสำหรับฟอร์มเดียวกัน แต่แยก tracking ได้

## 🗄️ Database Schema

### Tables
- `forms` - เก็บข้อมูลแบบสอบถาม
- `qr_codes` - เก็บ QR Code แบบ Dynamic
- `submissions` - เก็บคำตอบพร้อม UTM data

### Views
- `analytics_utm_summary` - สรุปผลตาม UTM
- `analytics_qr_performance` - สรุปประสิทธิภาพ QR Code

## 📝 License

MIT
