# Questionnaire QR System

<!-- README-I18N:START -->

[English](./README.md) | **ไทย**

<!-- README-I18N:END -->

Questionnaire QR System คือแอปพลิเคชัน Next.js สำหรับสร้าง เผยแพร่ และติดตามฟอร์มที่ใช้งานผ่าน QR โดยมีแผงผู้ดูแล ระบบเวอร์ชันฟอร์ม เวิร์กโฟลว์แบบร่าง การปรับแต่งธีม และการวิเคราะห์ข้อมูลการส่งแบบฟอร์ม

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- PostgreSQL + Prisma
- Supabase (auth/data integrations)
- Tailwind CSS

## Core Features

- Form builder ที่ปรับแต่งฟิลด์ได้
- เวิร์กโฟลว์แบบร่างและเผยแพร่ฟอร์ม
- ประวัติเวอร์ชันฟอร์มและการทำซ้ำ/คัดลอกเวอร์ชัน
- ธีมฟอร์มหลายรูปแบบ (default, card-groups, step-wizard, minimal)
- สร้าง QR code และติดตามการสแกน
- เก็บข้อมูลการส่งแบบฟอร์มและวิเคราะห์ผ่านหน้าผู้ดูแล
- ตัวเลือก Consent และ CSS integration

## Project Structure

```
src/app/            Next.js routes (admin UI, public form pages, API routes)
src/components/     Reusable UI and feature components
prisma/             Prisma schema and migrations
docs/               Setup, feature, API, and deployment documentation
public/             Static assets and demo HTML pages
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (or Docker)

## Quick Start (Local)

1. ติดตั้ง dependencies:

```bash
npm install
```

2. สร้างไฟล์ environment:

```bash
cp .env.example .env.local
```

3. กำหนดค่าที่จำเป็นใน `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db_name>
```

4. รัน development server:

```bash
npm run dev
```

เปิดใช้งานที่ http://localhost:3000.

## Run with Docker

สำหรับการรันแบบ container ในเครื่อง (app + PostgreSQL):

```bash
docker compose up -d --build
```

พอร์ตเริ่มต้นใน repository นี้:

- App: `1880`
- PostgreSQL: `5433`

หยุดบริการ:

```bash
docker compose down
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run lint checks
- `npm run db:types` - Generate Supabase TypeScript types

## Documentation

- Main docs index: `docs/README.md`
- Setup guides: `docs/01-setup/`
- Feature docs: `docs/02-features/`
- Usage guides: `docs/03-guides/`
- Deployment docs: `docs/04-deployment/`
- API docs: `docs/05-api/`

## Deployment Notes

- Production compose file: `docker-compose.prod.yml`
- Application Docker image is defined in `Dockerfile`
- ตรวจสอบ environment variables ให้ถูกต้องก่อน deploy production

## License

Private repository. Internal use only.