# PostgreSQL Migration Guide

ย้ายจาก Supabase ไป PostgreSQL @ senxgroup.com

---

## 📋 ข้อมูลการเชื่อมต่อ

```env
Host: 172.18.0.2
Port: 5432
Database: complaint_qr_db
Username: complaint
Password: 5wRV%C%9
```

---

## 1️⃣ ติดตั้ง Dependencies

```bash
npm install pg
# หรือ
npm install @vercel/postgres
```

---

## 2️⃣ สร้าง Database Client

### สร้างไฟล์ `src/lib/db.ts`

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST || '172.18.0.2',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'complaint_qr_db',
  user: process.env.DATABASE_USERNAME || 'complaint',
  password: process.env.DATABASE_PASSWORD || '5wRV%C%9',
});

export { pool };
export default pool;
```

---

## 3️⃣ สร้าง Tables ใน PostgreSQL

รันคำสั่ง SQL นี้ใน PostgreSQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  banner_color VARCHAR(50) DEFAULT 'blue',
  banner_mode VARCHAR(50) DEFAULT 'gradient',
  banner_custom_color VARCHAR(10) DEFAULT '#2563EB',
  theme VARCHAR(50) DEFAULT 'default',
  logo_url TEXT,
  current_version INTEGER DEFAULT 1,
  css_integration_enabled BOOLEAN DEFAULT false,
  css_field_mapping JSONB
);

-- Form versions table
CREATE TABLE IF NOT EXISTS form_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  fields JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_draft BOOLEAN DEFAULT false,
  css_integration_enabled BOOLEAN DEFAULT false,
  css_field_mapping JSONB
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  form_version INTEGER NOT NULL,
  responses JSONB NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  qr_slug VARCHAR(255)
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default CSS config
INSERT INTO app_settings (key, value, description)
VALUES (
  'css_api_config',
  '{"apiKey": "", "contactChannelId": "", "userCreated": ""}'::jsonb,
  'CSS API Configuration'
)
ON CONFLICT (key) DO NOTHING;
```

---

## 4️⃣ แก้ไขไฟล์ที่ใช้ Supabase

### ตัวอย่าง: `src/app/form/[slug]/page.tsx`

**จาก (Supabase):**
```typescript
const { data: form } = await supabase
  .from('forms')
  .select('*')
  .eq('slug', slug)
  .single();
```

**เป็น (PostgreSQL):**
```typescript
import { pool } from '@/lib/db';

const result = await pool.query(
  'SELECT * FROM forms WHERE slug = $1',
  [slug]
);
const form = result.rows[0];
```

---

## 5️⃣ API Routes ที่ต้องแก้

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `src/app/api/css/route.ts` | ใช้ pool.query แทน supabase |
| `src/app/api/forms/*/route.ts` | ใช้ pool.query แทน supabase |
| `src/app/admin/settings/page.tsx` | ใช้ pool.query แทน supabase |

---

## 6️⃣ ตัวอย่าง CRUD กับ PostgreSQL

### SELECT
```typescript
const { rows } = await pool.query('SELECT * FROM forms WHERE id = $1', [id]);
return rows[0];
```

### INSERT
```typescript
const { rows } = await pool.query(
  'INSERT INTO forms (title, slug) VALUES ($1, $2) RETURNING *',
  [title, slug]
);
return rows[0];
```

### UPDATE
```typescript
await pool.query(
  'UPDATE forms SET title = $1, updated_at = NOW() WHERE id = $2',
  [title, id]
);
```

### DELETE
```typescript
await pool.query('DELETE FROM forms WHERE id = $1', [id]);
```

---

## ⚠️ ข้อควรระวัง

1. **Prepared Statements**: ใช้ `$1, $2` แทนการ concat string (ป้องกัน SQL Injection)
2. **Connection Pool**: Pool จะจัดการ connection ให้อัตโนมัติ
3. **JSONB**: PostgreSQL รองรับ JSONB เหมือน Supabase
4. **UUID**: ใช้ `uuid_generate_v4()` แทน `gen_random_uuid()`

---

## 🔧 Testing

```typescript
// ทดสอบการเชื่อมต่อ
import { pool } from '@/lib/db';

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Connected:', result.rows[0]);
  } catch (err) {
    console.error('Connection failed:', err);
  }
}
```
