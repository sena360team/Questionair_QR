# Questionnaire QR System - Deployment Guide

## 📋 สิ่งที่ต้องเตรียมก่อน Deploy

### 1. Supabase Project (Production)
- สร้าง Project ใหม่ใน Supabase (หรือใช้ existing)
- อย่าลืม **คัดลอก Database Schema** จาก Dev → Production

---

## 🔧 Step 1: Database Migration (สำคัญ!)

### 1.1 รัน SQL Migrations ทั้งหมด

ไปที่ Supabase Dashboard → SQL Editor → รัน SQL ตามลำดับ:

```sql
-- ============================================
-- Migration 1: Create Tables
-- ============================================

-- Forms Table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    allow_multiple_responses BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft', -- draft, published, archived
    current_version INTEGER DEFAULT 0,
    require_consent BOOLEAN DEFAULT false,
    consent_heading TEXT DEFAULT 'การยินยอม (Consent)',
    consent_text TEXT,
    consent_require_location BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Codes Table
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    qr_slug TEXT NOT NULL UNIQUE,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    redirect_url TEXT,
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Form Versions Table
CREATE TABLE IF NOT EXISTS form_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    fields JSONB NOT NULL,
    fields_hash TEXT,
    change_summary TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(form_id, version)
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    form_version INTEGER DEFAULT 1,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    fingerprint TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Consent
    consent_given BOOLEAN DEFAULT false,
    consent_ip TEXT,
    consent_location JSONB,
    consented_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_code ON forms(code);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(qr_slug);
CREATE INDEX IF NOT EXISTS idx_qr_codes_form_id ON qr_codes(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_qr_code_id ON submissions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON form_versions(form_id);
```

```sql
-- ============================================
-- Migration 2: RLS Policies (เปิดให้ API ใช้งาน)
-- ============================================

-- Enable RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all for forms" ON forms;
DROP POLICY IF EXISTS "Enable all for projects" ON projects;
DROP POLICY IF EXISTS "Enable all for qr_codes" ON qr_codes;
DROP POLICY IF EXISTS "Enable all for form_versions" ON form_versions;
DROP POLICY IF EXISTS "Enable all for submissions" ON submissions;

-- Create policies (เปิดให้ทุกคนเข้าถึง - ปรับตามความต้องการ)
CREATE POLICY "Enable all for forms" ON forms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for qr_codes" ON qr_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for form_versions" ON form_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
```

```sql
-- ============================================
-- Migration 3: Functions
-- ============================================

-- Function to record QR scan
CREATE OR REPLACE FUNCTION record_qr_scan(qr_slug_param TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE qr_codes
    SET 
        scan_count = COALESCE(scan_count, 0) + 1,
        last_scanned_at = NOW()
    WHERE qr_slug = qr_slug_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## ⚙️ Step 2: Environment Variables

สร้างไฟล์ `.env.local` สำหรับ Production:

```bash
# ============================================
# Supabase Configuration (Production)
# ============================================

# ดึงจาก Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# App Configuration
# ============================================

# Production URL (สำหรับสร้าง QR Code)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Port (ถ้าใช้ custom port)
PORT=3000
```

> **หมายเหตุ:** อย่า commit `.env.local` ขึ้น Git! ใส่ใน `.gitignore`

---

## 🚀 Step 3: Build & Deploy

### 3.1 Build Production

```bash
# Install dependencies
npm ci

# Build
npm run build
```

### 3.2 Deploy Options

#### Option A: Vercel (แนะนำ)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**ตั้งค่า Environment Variables ใน Vercel:**
1. ไปที่ Project Settings → Environment Variables
2. เพิ่มตัวแปรทั้งหมดจาก `.env.local`

#### Option B: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build & Run
docker build -t questionnaire-qr .
docker run -p 3000:3000 --env-file .env.local questionnaire-qr
```

#### Option C: VPS / Cloud Server

```bash
# บน Server
mkdir -p /var/www/questionnaire-qr
cd /var/www/questionnaire-qr

# Clone หรือ Upload ไฟล์
git clone https://github.com/your-repo.git .

# Install & Build
npm ci
npm run build

# Run with PM2
npm install -g pm2
pm2 start npm --name "questionnaire-qr" -- start

# หรือใช้ systemd
```

---

## 🔒 Step 4: Security Checklist

### 4.1 CORS (ถ้าต้องการจำกัด API)

แก้ไขใน `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://your-allowed-domain.com', // หรือ * ถ้าเปิดทั้งหมด
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 4.2 API Authentication (ถ้าต้องการ)

เพิ่ม API Key ใน `src/app/api/forms/route.ts`:

```typescript
// Validate API Key
const apiKey = request.headers.get('x-api-key');
if (apiKey !== process.env.API_SECRET_KEY) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
```

### 4.3 Rate Limiting (แนะนำ)

ติดตั้ง `rate-limiter-flexible`:

```bash
npm install rate-limiter-flexible
```

ใช้งานใน API:

```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'api_limit',
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});
```

---

## 🌐 Step 5: Domain & HTTPS

### 5.1 Custom Domain (Vercel)
1. ไปที่ Project Settings → Domains
2. Add Domain → ใส่โดเมนของคุณ
3. ทำตามขั้นตอน Configure DNS

### 5.2 อัพเดท NEXT_PUBLIC_APP_URL

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://qr.yourcompany.com
```

แล้ว **rebuild** ใหม่

---

## 📊 Step 6: Monitoring & Logs

### 6.1 Supabase Logs
- ไปที่ Supabase Dashboard → Logs
- ดู Database logs, API logs

### 6.2 Vercel Analytics (ถ้าใช้ Vercel)
- เปิดใช้งานใน Project Settings

### 6.3 Error Tracking (แนะนำ Sentry)

```bash
npm install @sentry/nextjs
```

---

## ✅ Pre-Deploy Checklist

- [ ] Database schema ครบถ้วน (รัน migrations)
- [ ] RLS Policies เปิดใช้งาน
- [ ] Environment variables ครบ
- [ ] Build สำเร็จไม่มี error
- [ ] QR Code สแกนได้
- [ ] Form submit ได้
- [ ] API เรียกได้
- [ ] UTM tracking ทำงาน
- [ ] HTTPS enabled

---

## 🆘 Troubleshooting

### Error: "Missing Supabase environment variables"
**แก้ไข:** ตรวจสอบว่า `.env.local` มีตัวแปรครบ

### Error: "Permission denied" ที่ Supabase
**แก้ไข:** รัน RLS Policies SQL ใหม่

### QR Code ไม่ redirect
**แก้ไข:** ตรวจสอบ `NEXT_PUBLIC_APP_URL` ต้องตรงกับ URL จริง

### API ไม่ตอบสนอง
**แก้ไข:** ตรวจสอบ `SUPABASE_SERVICE_ROLE_KEY` ถูกต้อง

---

## 📞 Support

ถ้ามีปัญหาเพิ่มเติมติดต่อ:
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
