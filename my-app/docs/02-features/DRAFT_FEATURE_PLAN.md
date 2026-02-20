# แผนการพัฒนา: Draft Mode สำหรับฟอร์มที่ Publish แล้ว

## 📋 ภาพรวม

ฟีเจอร์นี้อนุญาตให้แก้ไขฟอร์มที่ Publish แล้ว โดยเก็บเป็น Draft ก่อน รอการ Review/Approve จึงค่อย Publish เป็น Version ใหม่

## 🎯 Use Cases

1. **ทีมงานหลายคน** - คนสร้างแก้ไข หัวหน้าอนุมัติ
2. **การรีวิวเนื้อหา** - ตรวจสอบคำถามก่อนให้ผู้ใช้เห็น
3. **การทดสอบ** - แก้ไขหลายรอบก่อน publish จริง
4. **การวางแผนล่วงหน้า** - เตรียมฟอร์มล่วงหน้า แล้วค่อยเปิดใช้

## 🏗️ สถาปัตยกรรมที่แนะนำ

### วิธีที่ 1: Draft แยกตาราง (RECOMMENDED)

```sql
-- ตารางใหม่: form_drafts
CREATE TABLE form_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE,
  
  -- Draft Data (คัดลอกจากฟอร์มต้นฉบับ)
  title text,
  description text,
  logo_url text,
  fields jsonb NOT NULL DEFAULT '[]',
  
  -- Consent Settings
  require_consent boolean DEFAULT false,
  consent_heading text DEFAULT 'การยินยอม (Consent)',
  consent_text text,
  consent_require_location boolean DEFAULT false,
  
  -- Workflow Status
  status draft_status DEFAULT 'editing',
  -- editing: กำลังแก้ไข
  -- pending_review: ส่งรีวิวแล้ว
  -- approved: อนุมัติแล้ว พร้อม publish
  -- rejected: ไม่อนุมัติ
  
  -- Review Info
  submitted_by uuid REFERENCES auth.users(id),
  submitted_at timestamptz,
  submitted_notes text, -- ข้อความส่งรีวิว
  
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text, -- ข้อความจากผู้รีวิว
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraint: ฟอร์มนึงมีได้แค่ draft เดียว
  UNIQUE(form_id)
);

-- Enable RLS
ALTER TABLE form_drafts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view drafts of their forms" ON form_drafts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_drafts.form_id 
      AND forms.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage their drafts" ON form_drafts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_drafts.form_id 
      AND forms.created_by = auth.uid()
    )
  );
```

### วิธีอื่นๆ (สำหรับอ้างอิง)

#### วิธีที่ 2: JSON Column (เร็วกว่า แต่ยืดหยุ่นน้อยกว่า)
```sql
-- เพิ่มคอลัมน์ใน forms
ALTER TABLE forms ADD COLUMN draft_data jsonb;
ALTER TABLE forms ADD COLUMN draft_status text DEFAULT NULL;
```

#### วิธีที่ 3: Pre-publish Version (ใช้ version มีอยู่)
```sql
-- สร้าง version ใหม่ status = 'draft'
-- แต่ต้องปรับ logic ให้ผู้ใช้เห็นแค่ version ล่าสุดที่ published
```

## 🔄 Workflow การทำงาน

```
┌─────────────────────────────────────────────────────────────┐
│  Published Form v2                                          │
│  ├─ Status: published                                       │
│  ├─ is_active: true                                         │
│  └─ Fields: [Q1, Q2, Q3]                                    │
│     ↑ ผู้ใช้เห็นและตอบได้                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ ผู้สร้างกด "Edit (Draft Mode)"
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Form Draft                                                 │
│  ├─ status: editing                                         │
│  ├─ Fields: [Q1, Q2, Q3, Q4, Q5]  ← กำลังแก้               │
│  └─ บันทึกอัตโนมัติ / บันทึกด้วยตนเอง                      │
│                                                             │
│  [Save Draft] [Preview] [Submit for Review] [Discard]      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ กด Submit for Review
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Form Draft                                                 │
│  ├─ status: pending_review                                  │
│  ├─ submitted_by: user_id                                   │
│  ├─ submitted_at: timestamp                                 │
│  └─ submitted_notes: "เพิ่มคำถามสุขภาพ"                     │
│                                                             │
│  [รอการอนุมัติ] [Cancel Submission]                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ หัวหน้า Review
                          ▼
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
    ┌─────────────────┐    ┌─────────────────┐
    │   APPROVED      │    │    REJECTED     │
    │                 │    │                 │
    │ [Publish v3]    │    │ [Edit Draft]    │
    │ review_notes    │    │ review_notes    │
    └─────────────────┘    └─────────────────┘
```

## 🖥️ UI/UX การออกแบบ

### 1. Badge/Indicator บนหน้า Forms List

```tsx
// แสดงสถานะ Draft ในหน้า list
{form.has_draft && (
  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
    มี Draft {form.draft_status === 'pending_review' && '• รอรีวิว'}
  </span>
)}
```

### 2. หน้า Edit Form (มี Draft)

```tsx
// Alert แจ้งเตือนเมื่อมี Draft
<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
  <div className="flex items-start gap-3">
    <Edit3 className="w-5 h-5 text-amber-600 mt-0.5" />
    <div className="flex-1">
      <p className="font-medium text-amber-900">คุณกำลังแก้ไข Draft</p>
      <p className="text-sm text-amber-700">
        ฟอร์มที่ Publish อยู่ยังไม่มีการเปลี่ยนแปลง 
        ผู้ใช้ยังเห็น Version {form.current_version} อยู่
      </p>
      <div className="flex gap-2 mt-3">
        <button className="px-3 py-1.5 bg-white text-amber-700 text-sm rounded-lg border border-amber-200 hover:bg-amber-50">
          Preview Changes
        </button>
        <button className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700">
          Submit for Review
        </button>
      </div>
    </div>
  </div>
</div>
```

### 3. Modal Submit for Review

```tsx
<Modal>
  <h3>ส่งรีวิวการแก้ไข</h3>
  <textarea 
    placeholder="อธิบายการเปลี่ยนแปลงที่ทำ... (optional)"
    value={submissionNotes}
    onChange={...}
  />
  <div className="flex gap-2">
    <button>Cancel</button>
    <button onClick={submitForReview}>Submit for Review</button>
  </div>
</Modal>
```

### 4. หน้า Review (สำหรับหัวหน้า)

```tsx
<div className="grid grid-cols-2 gap-6">
  {/* Left: Current Published */}
  <div>
    <h3>Version ปัจจุบัน (v{form.current_version})</h3>
    <FormPreview fields={form.fields} readonly />
  </div>
  
  {/* Right: Draft Changes */}
  <div>
    <h3>Draft Changes</h3>
    <FormPreview fields={draft.fields} readonly />
    
    <div className="flex gap-2 mt-4">
      <button onClick={approve} className="bg-green-600 text-white">
        ✓ Approve & Publish v{form.current_version + 1}
      </button>
      <button onClick={reject} className="bg-red-600 text-white">
        ✗ Reject
      </button>
    </div>
    
    <textarea 
      placeholder="ความคิดเห็น..."
      value={reviewNotes}
      onChange={...}
    />
  </div>
</div>
```

## 🎨 โครงสร้าง State

```typescript
// types/draft.ts
export interface FormDraft {
  id: string;
  form_id: string;
  
  // Content
  title: string;
  description: string;
  logo_url: string | null;
  fields: FormField[];
  
  // Consent
  require_consent: boolean;
  consent_heading: string;
  consent_text: string;
  consent_require_location: boolean;
  
  // Workflow
  status: 'editing' | 'pending_review' | 'approved' | 'rejected';
  
  // Submission
  submitted_by: string | null;
  submitted_at: string | null;
  submitted_notes: string | null;
  
  // Review
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  
  created_at: string;
  updated_at: string;
}

// hooks/useFormDraft.ts
export function useFormDraft(formId: string) {
  const [draft, setDraft] = useState<FormDraft | null>(null);
  
  const saveDraft = async (data: Partial<FormDraft>) => {
    // Upsert draft
  };
  
  const submitForReview = async (notes?: string) => {
    // Update status to pending_review
  };
  
  const approve = async (reviewNotes?: string) => {
    // Update status to approved
    // Optionally auto-publish
  };
  
  const reject = async (reviewNotes: string) => {
    // Update status to rejected
  };
  
  const publish = async () => {
    // 1. Create new version from draft
    // 2. Delete draft
    // 3. Update form
  };
  
  const discard = async () => {
    // Delete draft
  };
  
  return { draft, saveDraft, submitForReview, approve, reject, publish, discard };
}
```

## ⚠️ ความเสี่ยงและการแก้ไข

### 1. Concurrent Editing (ระดับ: 🟡 ปานกลาง)

**ปัญหา:** สองคนแก้ draft พร้อมกัน

**แก้ไข:**
```typescript
// ใช้ optimistic locking หรือ timestamp check
const saveDraft = async (data, lastUpdatedAt) => {
  const { error } = await supabase
    .from('form_drafts')
    .update(data)
    .eq('id', draftId)
    .eq('updated_at', lastUpdatedAt); // ถ้าไม่ตรง = มีคนแก้ไปแล้ว
    
  if (error) {
    throw new Error('มีการแก้ไขโดยผู้ใช้อื่น กรุณารีเฟรช');
  }
};
```

### 2. Auto-save vs Manual Save (ระดับ: 🟢 ต่ำ)

**แนะนำ:**
- Auto-save ทุก 30 วินาที (status = editing)
- Manual save สำหรับการกด Submit

### 3. Permission / Role (ระดับ: 🟡 ปานกลาง)

**ต้องมี:**
```sql
-- ตาราง user_roles หรือใช้ metadata
CREATE TABLE user_roles (
  user_id uuid PRIMARY KEY,
  role text CHECK (role IN ('creator', 'reviewer', 'admin'))
);

-- แยก permission
-- creator: สร้าง/แก้ไข draft ของตัวเอง
-- reviewer: อนุมัติ draft ในทีม
-- admin: ทำได้ทั้งหมด
```

### 4. Data Consistency (ระดับ: 🟢 ต่ำ)

**ตรวจสอบก่อน publish:**
```typescript
const publish = async () => {
  // ตรวจสอบว่า draft ตรงกับ form ล่าสุดไหม
  const currentForm = await getForm(formId);
  
  if (currentForm.updated_at > draft.created_at) {
    throw new Error('ฟอร์มมีการเปลี่ยนแปลงระหว่างที่คุณแก้ไข draft');
  }
  
  // Proceed with publish
};
```

## 📊 Migration Plan

### Phase 1: Basic Draft (1-2 วัน)
- [ ] สร้างตาราง `form_drafts`
- [ ] API: saveDraft, getDraft, deleteDraft
- [ ] UI: Draft indicator, Edit Draft button

### Phase 2: Review Workflow (2-3 วัน)
- [ ] Add status field
- [ ] API: submitForReview, approve, reject
- [ ] UI: Review modal, Reviewer panel

### Phase 3: Compare/Diff (1-2 วัน)
- [ ] Diff viewer (เหมือน git diff)
- [ ] Highlight สิ่งที่เปลี่ยน

### Phase 4: Notifications (1 วัน)
- [ ] Email/Toast เมื่อถูกขอรีวิว
- [ ] Email เมื่อถูกอนุมัติ/ปฏิเสธ

## 🎯 สรุป

| หัวข้อ | คะแนน |
|-------|--------|
| ความยาก | 🟡 ปานกลาง |
| ความเสี่ยง | 🟢 ต่ำ-ปานกลาง |
| ประโยชน์ | 🟢 สูง (สำหรับทีมงาน) |
| เวลาพัฒนา | 3-5 วัน (Phase 1-2) |

**คำแนะนำ:** เริ่มจาก Phase 1 ก่อน ถ้าใช้งานดีค่อยต่อ Phase 2-4
