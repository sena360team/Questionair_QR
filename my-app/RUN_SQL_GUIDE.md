# วิธีสร้างตารางใน Supabase

## Step 1: ไปที่ SQL Editor

```
https://supabase.com/dashboard/project/usdhywvksunuutrmapdv/sql/new
```

หรือเข้าผ่าน Dashboard:
1. ไปที่ https://supabase.com
2. เลือก Project ของคุณ
3. คลิก **"SQL Editor"** ในเมนูซ้าย
4. คลิก **"New query"**

```
┌─────────────────────────────────────────────────────────┐
│  Supabase Dashboard                                     │
│                                                         │
│  📁 Table Editor                                        │
│  🔍 SQL Editor  ←──── คลิกตรงนี้                       │
│  📊 Database                                            │
│  ⚙️  Settings                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Step 2: เปิดไฟล์ SQL

เปิดไฟล์นี้ในเครื่องคุณ:
```
my-app/supabase/migrations/COMPLETE_SETUP.sql
```

ก็อปทั้งหมด (Ctrl+A, Ctrl+C)

## Step 3: วางใน SQL Editor

```
┌─────────────────────────────────────────────────────────┐
│  SQL Editor                                    [Run] ✓  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ -- =================================================    │
│  │ -- Questionnaire QR System...                    │    │
│  │                                                  │    │
│  │ CREATE TABLE projects (...);                     │    │
│  │ CREATE TABLE forms (...);                        │    │
│  │ CREATE TABLE qr_codes (...);                     │    │
│  │ CREATE TABLE submissions (...);                  │    │
│  │ CREATE TABLE form_versions (...);                │    │
│  │ -- ... และอื่นๆ อีกเยอะ                          │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [🚀 Run]  หรือกด Ctrl + Enter                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Step 4: กด Run

คลิกปุ่ม **"Run"** หรือกด **Ctrl + Enter**

รอประมาณ 5-10 วินาที

## Step 5: ตรวจสอบ

คลิก **"Table Editor"** ในเมนูซ้าย ควรเห็น:

```
┌─────────────────────────────────────────┐
│  Tables                                 │
│  ✅ forms                               │
│  ✅ form_versions                       │
│  ✅ qr_codes                            │
│  ✅ submissions                         │
│  ✅ projects                            │
│                                         │
│  (ถ้าเห็นครบ = สำเร็จ!)               │
└─────────────────────────────────────────┘
```

## ถ้าขึ้น Error

### Error: "relation already exists"
```
แก้: ไม่มีปัญหา แสดงว่าสร้างไปแล้ว กด Run ซ้ำได้ไม่เป็นไร
```

### Error: "permission denied"
```
แก้: 
1. ไปที่ Authentication → Policies
2. ดูว่ามี policy "Allow all" หรือไม่
3. ถ้าไม่มี ให้รัน SQL นี้เพิ่ม:

ALTER TABLE forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions DISABLE ROW LEVEL SECURITY;
```

### Error: "function already exists"
```
แก้: ไม่มีปัญหา กด Run ต่อได้เลย
```

## ทดสอบว่าใช้งานได้

รัน SQL นี้ใน Editor:

```sql
-- ทดสอบเชื่อมต่อ
SELECT * FROM forms LIMIT 1;
SELECT * FROM qr_codes LIMIT 1;
SELECT * FROM submissions LIMIT 1;
```

ถ้าไม่ขึ้น error = **พร้อมใช้งาน!** ✅

---

## Shortcut (ถ้าขี้เกียจก็อป)

ก็อปทั้งหมดจากไฟล์นี้ไปวางได้เลย:
```
my-app/supabase/migrations/COMPLETE_SETUP.sql
```

มี 500+ บรรทัด ก็อปครั้งเดียวจบ!
