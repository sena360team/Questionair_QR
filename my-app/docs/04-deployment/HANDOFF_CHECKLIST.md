# 📝 Handoff Checklist - แจ้งให้ Kimi เข้าใจและช่วยได้

## 📌 ก่อนเริ่มบอกอะไรผม

### 1. บอก Context ก่อนเสมอ

```
✅ "ตอนนี้ทำถึงขั้นตอนไหนแล้ว"
✅ "กำลังทำตามไฟล์ไหน"
✅ "เจอปัญหาอะไร"
```

**ตัวอย่างที่ดี:**
> "กำลังทำตาม IMPLEMENTATION_CHECKLIST.md ขั้นที่ 3 รัน Database Migration แล้วเจอ error"

**ตัวอย่างที่ยังไม่ชัด:**
> "มัน error" ❌ (ไม่รู้ว่าอะไร error, ทำอะไรอยู่)

---

## 🔧 ถ้าเจอ Error

### บอกแบบนี้:

```markdown
## สถานะปัจจุบัน
- ทำอะไรอยู่: ___________
- ขั้นตอนที่: ___________
- ไฟล์ที่เกี่ยวข้อง: ___________

## Error ที่เจอ
```
[วาง error message ตรงนี้]
```

## สิ่งที่ลองแล้ว
- [ ] ลองแล้ว: ___________
- [ ] ผลลัพธ์: ___________

## สิ่งที่ต้องการให้ช่วย
- [ ] แก้ไข error
- [ ] อธิบายว่าทำไมถึง error
- [ ] ให้ทางเลือกอื่น
```

---

## 📋 ถ้าต้องการให้ทำอะไรต่อ

### รูปแบบคำสั่งที่เข้าใจง่าย:

| คำสั่ง | ความหมาย | ตัวอย่าง |
|--------|----------|----------|
| "ทำต่อจากจุดที่หยุด" | อ่าน handoff แล้วทำต่อ | "ทำ database migration ต่อจากที่หยุดไว้" |
| "แก้ไข [ส่วนไหน]" | แก้ code ที่ระบุ | "แก้ไข error ใน useFormVersions" |
| "เพิ่ม [ฟีเจอร์]" | สร้างใหม่ | "เพิ่มปุ่ม Export ใน VersionHistory" |
| "อธิบาย [เรื่องไหน]" | อธิบาย concept | "อธิบายว่าทำไมต้องใช้ RLS" |
| "สร้างเอกสาร [ชื่อ]" | สร้าง markdown | "สร้างเอกสาร testing guide" |

---

## 🎯 Keywords สำคัญที่ให้ใช้

### ถ้าพูดคำนี้ → ผมจะเข้าใจว่า:

| Keyword | ความหมาย | ผมจะทำอะไร |
|---------|----------|-------------|
| "database" หรือ "supabase" | เกี่ยวกับ SQL/Schema | เปิดไฟล์ migration หรือสร้าง SQL |
| "frontend" หรือ "ui" | เกี่ยวกับ React/Component | แก้ไข .tsx หรือสร้าง component |
| "api" หรือ "endpoint" | เกี่ยวกับ API Route | สร้างหรือแก้ API handler |
| "hook" | React Hook | แก้ไขหรือสร้าง custom hook |
| "type" หรือ "interface" | TypeScript types | แก้ไข types/index.ts |
| "test" หรือ "testing" | ทดสอบ | สร้าง test plan หรือ checklist |
| "error" หรือ "bug" | มีปัญหา | วิเคราะห์และแก้ไข |
| "refactor" | ปรับปรุง code | ปรับโครงสร้างโดยไม่เปลี่ยน functionality |
| "pause" หรือ "stop" | หยุดชั่วคราว | สรุปสถานะปัจจุบันไว้ |
| "resume" หรือ "continue" | กลับมาทำต่อ | อ่าน handoff แล้วทำต่อ |

---

## 📂 ไฟล์สำคัญที่ต้องรู้จัก

```
my-app/
├── docs/
│   ├── IMPLEMENTATION_CHECKLIST.md  ← แผนการทำงานหลัก
│   ├── HANDOFF_CHECKLIST.md         ← ไฟล์นี้
│   └── migrations/
│       └── 001_add_version_history_and_draft.sql  ← Database migration
│
├── src/
│   ├── types/
│   │   └── index.ts                 ← TypeScript types
│   │
│   ├── hooks/
│   │   ├── useFormVersions.ts       ← Hook สำหรับ version history
│   │   ├── useFormDraft.ts          ← Hook สำหรับ draft system
│   │   └── useDuplicateForm.ts      ← Hook สำหรับ duplicate
│   │
│   ├── components/
│   │   ├── VersionHistory.tsx       ← UI component แสดงประวัติ
│   │   └── DuplicateFormDialog.tsx  ← Dialog คัดลอกฟอร์ม
│   │
│   └── app/admin/forms/
│       ├── page.tsx                 ← หน้า list forms
│       └── [id]/
│           ├── page.tsx             ← Wrapper
│           └── EditFormPage.tsx     ← หน้า edit form แบบใหม่
│
└── package.json
```

---

## ⚡ Quick Commands (ใช้ได้ทันที)

### ถ้าพูดแบบนี้ ผมจะเข้าใจเลย:

**เริ่มทำงาน:**
```
"เริ่มทำตาม IMPLEMENTATION_CHECKLIST.md"
→ ผมจะเปิดไฟล์ checklist และเริ่มจากขั้นตอนแรก
```

**เจอปัญหา:**
```
"เจอ error ตอนรัน migration ส่วนที่ 3"
→ ผมจะดูไฟล์ migration บรรทัดที่เกี่ยวข้องและแก้ไข
```

**ทำต่อ:**
```
"กลับมาทำต่อจากที่หยุดไว้เมื่อวาน"
→ ผมจะอ่าน handoff แล้วทำต่อจากจุดนั้น
```

**ขอคำอธิบาย:**
```
"อธิบายว่า useFormDraft ทำงานยังไง"
→ ผมจะอธิบาย logic พร้อมชี้ไปยัง code ที่เกี่ยวข้อง
```

---

## 🐛 ตัวอย่างการแจ้งปัญหาที่ดี

### ❌ แบบที่ยังไม่ชัด:
```
"มันไม่ทำงาน"
"error อ่ะ"
"พัง"
```

### ✅ แบบที่ชัดเจน:
```
"กำลังทดสอบ Duplicate Form แล้วเจอ error:

Error: Failed to duplicate form
    at duplicate (useDuplicateForm.ts:45)

ขั้นตอนที่ทำ:
1. ไปที่ Forms List
2. กดปุ่ม "คัดลอก" ที่ฟอร์ม FRM-001
3. ใส่ชื่อ "Test Copy"
4. กด "สร้างฟอร์มใหม่"
5. ขึ้น error

สิ่งที่ลองแล้ว:
- ลอง refresh หน้าแล้ว ยัง error
- ลองดูใน Supabase ฟังก์ชัน duplicate_form ยังอยู่

ช่วยแก้หน่อย"
```

---

## 🎯 สรุป: บอกอะไรบ้างให้ผมเข้าใจ

### ✅ Must Have (ต้องบอกเสมอ):
1. ทำอะไรอยู่ (context)
2. เจออะไร (error/ปัญหา)
3. ต้องการอะไร (ให้ช่วยอะไร)

### ✅ Good to Have (บอกได้ถ้ามี):
4. ทำมาถึงไหนแล้ว (progress)
5. ลองอะไรมาแล้วบ้าง (tried solutions)
6. มี error message อะไรบ้าง (logs)

### ❌ Don't Need (ไม่ต้องบอก):
- อธิบายระบบทั้งหมดตั้งแต่ต้น (ผมมี context อยู่แล้ว)
- ส่ง screenshot ถ้าเป็น text error ได้ (copy text มาดีกว่า)
- บอกทุกรายละเอียดเล็กๆ น้อยๆ (บอกแค่สำคัญ)

---

## 💬 ตัวอย่างประโยคที่ใช้ได้เลย

```markdown
## เริ่มทำงาน
"เริ่มทำ database migration ตาม IMPLEMENTATION_CHECKLIST.md"

## กำลังทำ
"ทำถึงขั้นที่ 3 รัน migration ส่วนที่ 1-2 ผ่าน กำลังจะรันส่วนที่ 3"

## เจอปัญหา
"เจอ error ตอนรันส่วนที่ 3:
```
ERROR: relation "form_drafts" already exists
```
ช่วยดูหน่อยว่าต้องทำยังไง"

## ขอคำอธิบาย
"อธิบายหน่อยว่าทำไมต้องสร้าง form_drafts แยก ทำไมไม่เพิ่ม column ใน forms"

## ทดสอบ
"ทดสอบ Duplicate Form เสร็จแล้ว ผ่านหมด ขอ checklist สำหรับทดสอบ Revert หน่อย"

## หยุดพัก
"ขอหยุดก่อน ทำถึงขั้นที่ 4 แล้ว สรุปสถานะไว้ให้หน่อย"

## กลับมาทำต่อ
"กลับมาทำต่อจากที่หยุดไว้เมื่อวาน"
```

---

**หมายเหตุ:** ไฟล์นี้อยู่ที่ `docs/HANDOFF_CHECKLIST.md`
