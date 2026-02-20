# 🔧 Environment Variables Setup

คู่มือการตั้งค่า Environment Variables สำหรับแต่ละ environment

---

## 📁 ไฟล์ .env ต่างๆ

| ไฟล์ | ใช้เมื่อไหร่ | อัพ GitHub? |
|------|-----------|------------|
| `.env` | Base variables (ทุก environment) | ❌ ไม่ควร |
| `.env.local` | Local development (เครื่องคุณ) | ❌ ไม่ควร |
| `.env.development` | Development mode (`npm run dev`) | ⚠️ ได้ (แต่ไม่มี secrets) |
| `.env.production` | Production build (`npm run build`) | ⚠️ ได้ (แต่ไม่มี secrets) |
| `.env.test` | Testing mode | ⚠️ ได้ |

---

## 🏠 Local Development (เครื่องคุณ)

### ไฟล์: `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**วิธีใช้:** สร้างไฟล์ `.env.local` ใน root โปรเจกต์ (อยู่แล้ว)

---

## 🚀 Production (Vercel)

### วิธีที่ 1: Vercel Dashboard (แนะนำ)

1. ไปที่ [vercel.com](https://vercel.com)
2. เลือก Project → Settings → Environment Variables
3. เพิ่มตัวแปรทีละตัว:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://your-project.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your-anon-key |
| `SUPABASE_SERVICE_ROLE_KEY` | your-service-role-key |
| `NEXT_PUBLIC_APP_URL` | https://your-domain.com |

### วิธีที่ 2: Vercel CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

---

## 🖥️ Production (Server ส่วนตัว / VPS)

### วิธีที่ 1: ไฟล์ .env บน Server

```bash
# SSH เข้า server
ssh user@your-server.com

# เข้าโฟลเดอร์โปรเจกต์
cd /var/www/my-app

# สร้าง .env.local หรือ .env.production
nano .env.local
```

### วิธีที่ 2: Docker

```dockerfile
# Dockerfile
ENV NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### วิธีที่ 3: PM2

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-app',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key'
    }
  }]
}
```

---

## ⚠️ สิ่งที่ต้องระวัง

### ❌ ห้ามทำ
- ห้าม commit ไฟล์ `.env` ที่มีค่าจริง
- ห้ามแชร์ API keys ในที่สาธารณะ
- ห้ามใช้ production keys ใน development

### ✅ ควรทำ
- ใช้ `.env.example` บอกว่าต้องมีตัวแปรอะไรบ้าง
- ใช้ `NEXT_PUBLIC_` prefix เฉพาะตัวแปรที่ต้องใช้ใน client-side
- เก็บ Service Role Key ไว้ server-side เท่านั้น

---

## 🔍 ตรวจสอบว่าใช้งานได้ไหม

```bash
# Local
npm run dev
# ตรวจสอบ console ว่าอ่าน env ได้ไหม

# Production build (ทดสอบก่อน deploy)
npm run build
# ถ้า build สำเร็จ = env ถูกต้อง
```

---

## 📋 Checklist ก่อน Deploy

- [ ] ตั้งค่า Environment Variables ใน Vercel/Server
- [ ] ตรวจสอบว่า `NEXT_PUBLIC_` ใช้กับตัวแปรที่จำเป็นจริงๆ
- [ ] ไม่มี secrets ใน source code
- [ ] Test build ผ่าน (`npm run build`)
- [ ] Test บน staging ก่อน production
