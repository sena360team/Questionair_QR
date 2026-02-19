# แผนพัฒนา: Draft Version System + QR Code Tab

## 1. ระบบ Draft + Version History

### ปัญหาปัจจุบัน
- เมื่อกด "แก้ไข (Draft)" แล้วเซฟ ระบบบันทึกทับเวอร์ชันเดิมทันที
- ไม่มีประวัติการแก้ไขที่ชัดเจน
- ไม่สามารถแยกแยะระหว่าง Published vs Draft ได้

### Flow ที่ต้องการ

```
Version 7 (Published) - Current
    ↓
กด "แก้ไข (Draft)" 
    ↓
สร้าง Version 8 (Draft) - บันทึกใน history
    ↓
หน้าแสดงผล: Version 7 ยังเป็น Current (Published)
           Version 8 แสดงใน tab ประวัติเป็น Draft
    ↓
กด Publish → Version 8 กลายเป็น Current
```

### โครงสร้างข้อมูล

```typescript
// Form Table (current)
{
  id: string
  current_version: number      // 7 (Published - ยังคงเป็นตัวนี้)
  status: 'published' | 'draft' | 'archived'
  has_draft: boolean          // true
  draft_version: number       // 8
  title: string              // ข้อมูลของ Version 7 (Published)
  fields: FormField[]
}

// Form Versions Table (แยกเก็บทุกเวอร์ชัน)
{
  id: string
  form_id: string
  version: number            // 7, 8, 9...
  status: 'published' | 'draft' | 'archived'
  title: string
  fields: FormField[]
  created_at: timestamp
  created_by: string
  is_current: boolean        // true สำหรับเวอร์ชันที่เป็น Current
}
```

### API Endpoints ที่สร้างแล้ว

```typescript
// 1. ดึง Version History (รวม Draft)
GET /api/form-versions?formId={id}
- ดึงทุกเวอร์ชันจาก form_versions
- เรียงตาม version desc
- แสดงทั้ง Published และ Draft
- ตอบกลับพร้อม current_version, draft_version, has_draft

// 2. สร้าง Draft ใหม่
POST /api/form-versions
Body: { formId, title, description, fields, theme, colors, consent, change_summary }
- Clone ข้อมูลจาก current_version
- สร้าง version ใหม่ (current_version + 1)
- บันทึกลง form_versions ด้วย status='draft'
- อัปเดต forms.draft_version = new_version
- อัปเดต forms.has_draft = true

// 3. บันทึก Draft (อัปเดต)
PUT /api/form-versions/{versionId}
Body: { title, description, fields, theme, colors, consent, change_summary }
- อัปเดตเฉพาะ form_versions ที่เป็น draft
- ไม่แตะ forms หลัก
- ตรวจสอบว่าเป็น draft จริงๆ ก่อนอัปเดต

// 4. Publish Draft
POST /api/form-versions/publish
Body: { versionId, changeSummary? }
- อัปเดต forms.current_version = draft.version
- อัปเดต forms fields ตาม draft data
- อัปเดต form_versions status='published'
- อัปเดต forms.has_draft = false
- อัปเดต forms.draft_version = null

// 5. ลบ Draft
DELETE /api/form-versions/{versionId}
- ลบ draft จาก form_versions
- อัปเดต forms.has_draft = false
- อัปเดต forms.draft_version = null
```

### UI Changes

#### Tab: แก้ไข (Edit)
- ถ้ามี Draft → โหลดข้อมูล Draft
- ถ้าไม่มี Draft → โหลดข้อมูล Current
- ปุ่ม "บันทึก Draft" → บันทึกแค่ Draft
- ปุ่ม "Publish" → Publish Draft เป็นของจริง

#### Tab: ประวัติ (History)
```
┌─────────────────────────────────────────┐
│ Version 8 (Draft) ← กำลังแก้ไข          │
│ สร้าง: 16 ก.พ. 2569 โดย Admin           │
│ [กลับเป็น Draft นี้] [ลบ Draft]          │
├─────────────────────────────────────────┤
│ Version 7 (Published) ← Current ✓       │
│ สร้าง: 13 ก.พ. 2569                     │
│ [ดูตัวอย่าง] [คืนเป็นเวอร์ชันนี้]        │
├─────────────────────────────────────────┤
│ Version 6 (Published)                   │
│ ...                                     │
└─────────────────────────────────────────┘
```

### Database Schema Updates

```sql
-- เพิ่มคอลัมน์ใน forms table
ALTER TABLE forms ADD COLUMN draft_version INTEGER DEFAULT NULL;
ALTER TABLE forms ADD COLUMN draft_data JSONB DEFAULT NULL; -- เก็บข้อมูล draft ชั่วคราว

-- สร้างตาราง form_versions (ถ้ายังไม่มี)
CREATE TABLE form_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'published', 'draft', 'archived'
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_current BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(form_id, version)
);

-- Index สำหรับค้นหา
CREATE INDEX idx_form_versions_form_id ON form_versions(form_id);
CREATE INDEX idx_form_versions_version ON form_versions(version);
CREATE INDEX idx_form_versions_status ON form_versions(status);
```

---

## 2. QR Code Tab ในหน้าแก้ไขฟอร์ม

### การแสดงผล

```
┌─────────────────────────────────────────────────────────────┐
│ [ข้อมูล] [คำถาม] [ตั้งค่า] [ประวัติ] [QR Codes] 🔥 NEW       │
├─────────────────────────────────────────────────────────────┤
│ QR Codes ของแบบสอบถามนี้                                     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [QR Image]  QR-001 - งานสัมมนา 2024                  │     │
│ │            สแกน: 156 ครั้ง | สร้าง: 10 ม.ค. 2567    │     │
│ │            UTM: source=facebook, medium=qr           │     │
│ │            [ดาวน์โหลด] [แก้ไข] [ดูสถิติ]             │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [QR Image]  QR-002 - งานเปิดตัวสินค้า                │     │
│ │            สแกน: 89 ครั้ง | สร้าง: 15 ม.ค. 2567      │     │
│ │            UTM: source=event, medium=print           │     │
│ │            [ดาวน์โหลด] [แก้ไข] [ดูสถิติ]             │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│ [+ สร้าง QR Code ใหม่]                                      │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints

```typescript
// ดึง QR Codes ตาม form_id
GET /api/forms/:id/qr-codes
Response: {
  qrCodes: [
    {
      id: string
      name: string
      qr_slug: string
      qr_image_url: string
      scan_count: number
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
      created_at: string
    }
  ]
}
```

### Component Structure

```typescript
// components/form-tabs/QRCodeTab.tsx
interface QRCodeTabProps {
  formId: string;
}

export function QRCodeTab({ formId }: QRCodeTabProps) {
  // Fetch QR codes
  // Display list
  // Actions: download, edit, view stats
}
```

### UI Elements

1. **QR Code Card**
   - รูป QR Code (เล็ก)
   - ชื่อ QR Code
   - จำนวนสแกน
   - วันที่สร้าง
   - UTM Parameters (ถ้ามี)
   - Action buttons: Download PNG, Edit, View Stats

2. **Empty State**
   - แสดงเมื่อไม่มี QR Code
   - ปุ่ม "สร้าง QR Code ใหม่"

3. **Create Button**
   - Link ไปหน้า `/admin/qr-codes/create?formId={formId}`

---

## 3. Files ที่ต้องแก้ไข

### Backend (API)
- [ ] `app/api/forms/[id]/draft/route.ts` - POST, PUT
- [ ] `app/api/forms/[id]/publish-draft/route.ts` - POST
- [ ] `app/api/forms/[id]/versions/route.ts` - GET
- [ ] `app/api/forms/[id]/qr-codes/route.ts` - GET

### Frontend Components
- [ ] `app/admin/forms/[id]/page.tsx` - เพิ่ม Tab QR Codes
- [ ] `components/form-tabs/EditTab.tsx` - ปรับการบันทึก Draft
- [ ] `components/form-tabs/HistoryTab.tsx` - แสดง Draft + Published
- [ ] `components/form-tabs/QRCodeTab.tsx` - ใหม่

### Database
- [ ] Migration: เพิ่มคอลัมน์ draft_version, draft_data
- [ ] Migration: สร้างตาราง form_versions (ถ้ายังไม่มี)

---

## 4. Step-by-Step Implementation

### Phase 1: Draft System
1. สร้าง database migration
2. สร้าง API endpoints สำหรับ Draft
3. ปรับ Edit Tab ให้รองรับ Draft
4. ปรับ History Tab แสดง Draft แยก

### Phase 2: QR Code Tab
1. สร้าง API endpoint ดึง QR Codes
2. สร้าง QRCodeTab component
3. เพิ่ม Tab ใน Form Edit Page
4. ทดสอบการแสดงผล

---

## 5. Key Decisions

1. **Draft Storage**: ใช้ `draft_data` JSONB ใน forms table สำหรับ draft ล่าสุด ไม่ต้องสร้าง version ทุกครั้งที่ auto-save
   
2. **Version Creation**: สร้าง version จริงเมื่อกด "บันทึก Draft" เท่านั้น

3. **Current Display**: แสดงข้อมูลจาก `forms` table เสมอ (ซึ่งคือ Published version)

4. **QR Code Tab**: ดึงข้อมูลจาก `qr_codes` table โดย filter ด้วย `form_id`
