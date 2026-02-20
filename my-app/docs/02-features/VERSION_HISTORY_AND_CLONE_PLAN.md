# แผนการพัฒนา: Version History + Revert + Clone/Duplicate

## 📋 ภาพรวมฟีเจอร์

เพิ่มความสามารถในการ:
1. **ดูประวัติ Version** - เรียกดูทุก version ที่เคย publish
2. **Revert (คืนค่า)** - กลับไปใช้ version เก่า
3. **Duplicate/Clone** - คัดลอกฟอร์มเป็นอันใหม่ (Draft)

## 🏗️ โครงสร้างฐานข้อมูลปัจจุบัน

```sql
-- ตารางที่มีอยู่แล้ว
forms: id, code, title, fields, current_version, status, ...
form_versions: id, form_id, version, fields, published_at, change_summary
form_drafts: (ใหม่จากแผนก่อนหน้า)
```

## 🎯 Use Cases

### 1. ดูประวัติ Version (Version History)
```
ผู้ใช้: "อยากดูว่า version 2 มีคำถามอะไรบ้าง"
→ เปิด History Panel
→ เลือก Version 2
→ ดูแบบ Read-only (ไม่แก้ไขได้)
```

### 2. Revert กลับไป Version เก่า
```
ผู้ใช้: "Version 3 แก้พลาด อยากกลับไปใช้ version 2"
→ ดู Version 2
→ กด "Revert to this version"
→ สร้าง Draft จาก Version 2
→ แก้ไขเพิ่มได้ (ถ้าต้องการ)
→ Publish เป็น Version 4 (เนื้อหาเหมือน v2)
```

### 3. Duplicate/Clone ฟอร์ม
```
ผู้ใช้: "ฟอร์มนี้ดี อยากเอาไปแก้เป็นฟอร์มใหม่"
→ กด "Duplicate"
→ สร้างฟอร์มใหม่ (Draft)
→ Code ใหม่: FRM-XXX
→ คำถามคัดลอกจากต้นฉบับ
→ แก้ไขได้ตามต้องการ
→ Publish เมื่อพร้อม
```

## 📊 Data Model ที่ต้องปรับ

### 1. ตาราง `form_versions` (เพิ่มฟิลด์)

```sql
-- เพิ่ม metadata สำหรับแต่ละ version
ALTER TABLE form_versions ADD COLUMN IF NOT EXISTS 
  title TEXT,                    -- Title ตอน publish
  description TEXT,              -- Description ตอน publish
  logo_url TEXT,                 -- Logo ตอน publish
  require_consent BOOLEAN DEFAULT FALSE,
  consent_heading TEXT,
  consent_text TEXT,
  consent_require_location BOOLEAN DEFAULT FALSE,
  published_by UUID REFERENCES auth.users(id),  -- ใคร publish
  is_reverted BOOLEAN DEFAULT FALSE,            -- ถูก revert ไหม
  reverted_to_version INTEGER,                  -- revert ไป version ไหน
  created_from_clone UUID REFERENCES forms(id); -- ถูก clone มาจากไหน

-- Index สำหรับค้นหาเร็ว
CREATE INDEX idx_form_versions_form_id_version ON form_versions(form_id, version);
```

### 2. ตาราง `forms` (เพิ่มฟิลด์)

```sql
-- เพิ่ม track ว่าฟอร์มนี้มาจากการ clone
ALTER TABLE forms ADD COLUMN IF NOT EXISTS 
  cloned_from UUID REFERENCES forms(id),
  cloned_at TIMESTAMPTZ,
  parent_form_id UUID REFERENCES forms(id); -- สำหรับฟอร์มที่ clone มา
```

## 🔄 Workflows

### Workflow A: View Version History

```
┌────────────────────────────────────────┐
│ Form Detail Page                       │
│ แถบ: [Content] [Settings] [History]   │
│                                         │
│ Version History:                        │
│ ┌────────────────────────────────────┐ │
│ │ v3 (current) - 15 Jan 2024        │ │
│ │   Published by: Admin              │ │
│ │   Changes: "เพิ่มคำถามสุขภาพ"      │ │
│ │   [View] [Revert]                  │ │
│ ├────────────────────────────────────┤ │
│ │ v2 - 10 Jan 2024                  │ │
│ │   Published by: Admin              │ │
│ │   Changes: "แก้ไขคำถามที่ 3"       │ │
│ │   [View] [Revert]                  │ │
│ ├────────────────────────────────────┤ │
│ │ v1 - 5 Jan 2024                   │ │
│ │   Published by: Admin              │ │
│ │   Changes: "Initial publish"       │ │
│ │   [View] [Revert]                  │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Workflow B: Revert to Version

```
1. User กด "Revert" ที่ Version 2
   ↓
2. แสดง Confirm Dialog:
   "คุณต้องการคืนค่าไป Version 2?
   - ระบบจะสร้าง Draft จาก Version 2
   - คุณสามารถแก้ไขเพิ่มก่อน Publish
   - Version ปัจจุบันยังใช้งานได้จนกว่าจะ Publish"
   ↓
3. สร้าง/อัพเดท form_drafts:
   - fields = form_versions[2].fields
   - title = form_versions[2].title
   - status = 'editing'
   - is_revert = true
   - revert_from_version = 3
   - revert_to_version = 2
   ↓
4. Redirect ไปหน้า Edit Form (Draft Mode)
   ↓
5. User แก้ไขเพิ่ม (optional)
   ↓
6. User Publish → สร้าง Version 4
   - เนื้อหาเหมือน v2 (อาจแก้เล็กน้อย)
   - form_versions[4].change_summary = "Revert to v2 + minor edits"
```

### Workflow C: Duplicate/Clone Form

```
1. User กด "Duplicate" จากหน้า Forms List หรือ Form Detail
   ↓
2. แสดง Dialog:
   "สร้างฟอร์มใหม่จากต้นฉบับ"
   
   [✓] Copy คำถาม
   [✓] Copy การตั้งค่า Consent
   [ ] Copy โลโก้ (เลือกได้)
   [ ] Copy QR Codes (ปกติไม่ copy)
   
   ชื่อฟอร์มใหม่: [___________________]
   รหัส: [FRM-XXX] (auto)
   
   [Cancel] [Create Draft]
   ↓
3. สร้างฟอร์มใหม่:
   ```sql
   INSERT INTO forms (
     code,           -- FRM-XXX (ใหม่)
     title,          -- ชื่อที่ user ใส่
     slug,           -- auto จาก title
     fields,         -- copy จากต้นฉบับ
     description,    -- copy
     logo_url,       -- copy ถ้าเลือก
     require_consent,-- copy
     consent_heading,-- copy
     consent_text,   -- copy
     consent_require_location, -- copy
     status,         -- 'draft'
     current_version,-- 0
     cloned_from,    -- id ต้นฉบับ
     cloned_at,      -- now()
     created_by      -- current user
   );
   ```
   ↓
4. Redirect ไปหน้า Edit Form (Draft Mode)
   ↓
5. User แก้ไขตามต้องการ
   ↓
6. Publish → Version 1 ของฟอร์มใหม่
```

## 🎨 UI/UX Design

### 1. Tab Component สำหรับ Form Detail

```tsx
// หน้า Edit Form มี 3 Tabs
<Tabs defaultValue="content">
  <TabsList>
    <TabsTrigger value="content">
      <FileText className="w-4 h-4 mr-2" />
      Content
      {hasDraft && <Badge variant="amber">Draft</Badge>}
    </TabsTrigger>
    <TabsTrigger value="settings">
      <Settings className="w-4 h-4 mr-2" />
      Settings
    </TabsTrigger>
    <TabsTrigger value="history">
      <History className="w-4 h-4 mr-2" />
      History
      <Badge variant="secondary">v{form.current_version}</Badge>
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="content">...</TabsContent>
  <TabsContent value="settings">...</TabsContent>
  <TabsContent value="history">
    <VersionHistory formId={form.id} />
  </TabsContent>
</Tabs>
```

### 2. Version History Component

```tsx
function VersionHistory({ formId }: { formId: string }) {
  const { versions } = useFormVersions(formId);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Version List */}
      <div className="space-y-4">
        <h3 className="font-semibold">Version History</h3>
        
        {versions.map((version) => (
          <div 
            key={version.version}
            className={cn(
              "p-4 rounded-xl border cursor-pointer transition-colors",
              selectedVersion === version.version 
                ? "border-blue-500 bg-blue-50" 
                : "border-slate-200 hover:border-slate-300"
            )}
            onClick={() => setSelectedVersion(version.version)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-2 py-1 rounded text-sm font-medium",
                  version.version === currentVersion 
                    ? "bg-green-100 text-green-700" 
                    : "bg-slate-100 text-slate-700"
                )}>
                  v{version.version}
                  {version.version === currentVersion && " (current)"}
                </span>
                <span className="text-sm text-slate-500">
                  {formatDate(version.published_at)}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => viewVersion(version)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => revertToVersion(version)}>
                    <Undo className="w-4 h-4 mr-2" />
                    Revert to this version
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateFromVersion(version)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate from here
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <p className="text-sm text-slate-600 mt-2">
              {version.change_summary || "No description"}
            </p>
            
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span>{version.fields.length} questions</span>
              <span>By: {version.published_by_name}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Right: Preview Selected Version */}
      <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
        {selectedVersion ? (
          <VersionPreview 
            version={versions.find(v => v.version === selectedVersion)} 
          />
        ) : (
          <div className="text-center py-12 text-slate-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select a version to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3. Duplicate Dialog

```tsx
function DuplicateDialog({ form, onClose }: { form: Form; onClose: () => void }) {
  const [newTitle, setNewTitle] = useState(`${form.title} (Copy)`);
  const [options, setOptions] = useState({
    copyQuestions: true,
    copySettings: true,
    copyLogo: true,
    copyQR: false,
  });
  
  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>Duplicate Form</DialogTitle>
        <DialogDescription>
          Create a new form based on "{form.title}"
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div>
          <Label>New Form Title</Label>
          <Input 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-3">
          <Label>What to copy?</Label>
          
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={options.copyQuestions}
              onCheckedChange={(v) => setOptions({...options, copyQuestions: v})}
            />
            <span className="text-sm">All questions ({form.fields.length})</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={options.copySettings}
              onCheckedChange={(v) => setOptions({...options, copySettings: v})}
            />
            <span className="text-sm">Consent settings</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={options.copyLogo}
              onCheckedChange={(v) => setOptions({...options, copyLogo: v})}
            />
            <span className="text-sm">Logo</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={options.copyQR}
              onCheckedChange={(v) => setOptions({...options, copyQR: v})}
            />
            <span className="text-sm text-amber-600">
              QR Codes (will generate new codes)
            </span>
          </div>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
          <Info className="w-4 h-4 inline mr-2" />
          The new form will be created as a Draft. 
          You can edit it before publishing.
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleDuplicate}>Create Draft</Button>
      </DialogFooter>
    </Dialog>
  );
}
```

### 4. Action Menu ในหน้า Forms List

```tsx
// แต่ละ Form Card มี Dropdown Menu
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreVertical className="w-4 h-4" />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem asChild>
      <Link href={`/admin/forms/${form.id}`}>
        <Edit className="w-4 h-4 mr-2" /> Edit
      </Link>
    </DropdownMenuItem>
    
    <DropdownMenuItem onClick={() => setShowDuplicateDialog(form)}>
      <Copy className="w-4 h-4 mr-2" /> Duplicate
    </DropdownMenuItem>
    
    <DropdownMenuItem asChild>
      <Link href={`/admin/forms/${form.id}?tab=history`}>
        <History className="w-4 h-4 mr-2" /> Version History
      </Link>
    </DropdownMenuItem>
    
    <DropdownMenuSeparator />
    
    <DropdownMenuItem 
      onClick={() => setShowDeleteConfirm(form.id)}
      className="text-red-600"
    >
      <Trash2 className="w-4 h-4 mr-2" /> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 🔌 API Endpoints

### 1. Get Version History

```typescript
// GET /api/forms/[id]/versions
interface GetVersionsResponse {
  versions: {
    version: number;
    title: string;
    description: string;
    fields: FormField[];
    change_summary: string;
    published_at: string;
    published_by: {
      id: string;
      name: string;
    };
    is_reverted: boolean;
    reverted_to_version?: number;
  }[];
}

// รวม metadata สำหรับแสดงผล
```

### 2. Get Single Version

```typescript
// GET /api/forms/[id]/versions/[version]
interface GetVersionResponse {
  version: number;
  form_data: {
    title: string;
    description: string;
    logo_url: string;
    fields: FormField[];
    require_consent: boolean;
    consent_heading: string;
    consent_text: string;
    consent_require_location: boolean;
  };
  metadata: {
    published_at: string;
    published_by: User;
    change_summary: string;
  };
}
```

### 3. Revert to Version

```typescript
// POST /api/forms/[id]/revert
interface RevertRequest {
  to_version: number;
  notes?: string; // เหตุผลในการ revert
}

interface RevertResponse {
  draft_id: string;
  message: "Draft created from version X";
}

// Logic:
// 1. ดึงข้อมูลจาก form_versions[to_version]
// 2. สร้าง/อัพเดท form_drafts สำหรับ form นี้
// 3. ตั้งค่า draft.revert_from_version = current_version
// 4. ตั้งค่า draft.revert_to_version = to_version
// 5. Return draft id สำหรับ redirect ไป edit
```

### 4. Duplicate Form

```typescript
// POST /api/forms/[id]/duplicate
interface DuplicateRequest {
  title: string;
  options: {
    copy_questions: boolean;
    copy_settings: boolean;
    copy_logo: boolean;
    copy_qr_codes: boolean;
  };
}

interface DuplicateResponse {
  new_form_id: string;
  code: string;
  message: "Form duplicated successfully";
}

// Logic:
// 1. สร้าง form ใหม่ (status = draft)
// 2. Copy ข้อมูลตาม options
// 3. ถ้า copy QR: สร้าง qr_codes ใหม่ (slug ใหม่)
// 4. Set cloned_from = original form id
// 5. Return new form id
```

## 🗄️ Database Functions

### Function: Create Draft from Version

```sql
CREATE OR REPLACE FUNCTION create_draft_from_version(
  p_form_id UUID,
  p_version INTEGER,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_draft_id UUID;
  v_version_data RECORD;
BEGIN
  -- ดึงข้อมูล version
  SELECT * INTO v_version_data
  FROM form_versions
  WHERE form_id = p_form_id AND version = p_version;
  
  -- Upsert draft
  INSERT INTO form_drafts (
    form_id,
    title,
    description,
    logo_url,
    fields,
    require_consent,
    consent_heading,
    consent_text,
    consent_require_location,
    status,
    is_revert,
    revert_to_version,
    created_at,
    updated_at
  )
  VALUES (
    p_form_id,
    v_version_data.title,
    v_version_data.description,
    v_version_data.logo_url,
    v_version_data.fields,
    v_version_data.require_consent,
    v_version_data.consent_heading,
    v_version_data.consent_text,
    v_version_data.consent_require_location,
    'editing',
    true,
    p_version,
    NOW(),
    NOW()
  )
  ON CONFLICT (form_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    fields = EXCLUDED.fields,
    require_consent = EXCLUDED.require_consent,
    consent_heading = EXCLUDED.consent_heading,
    consent_text = EXCLUDED.consent_text,
    consent_require_location = EXCLUDED.consent_require_location,
    status = 'editing',
    is_revert = true,
    revert_to_version = p_version,
    updated_at = NOW()
  RETURNING id INTO v_draft_id;
  
  RETURN v_draft_id;
END;
$$;
```

### Function: Duplicate Form

```sql
CREATE OR REPLACE FUNCTION duplicate_form(
  p_source_form_id UUID,
  p_new_title TEXT,
  p_user_id UUID,
  p_copy_questions BOOLEAN DEFAULT true,
  p_copy_settings BOOLEAN DEFAULT true,
  p_copy_logo BOOLEAN DEFAULT true,
  p_copy_qr BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_form_id UUID;
  v_new_code TEXT;
  v_source_form RECORD;
  v_max_num INTEGER;
BEGIN
  -- Generate new code
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO v_max_num
  FROM forms;
  
  v_new_code := 'FRM-' || LPAD(v_max_num::TEXT, 3, '0');
  
  -- Get source form
  SELECT * INTO v_source_form
  FROM forms WHERE id = p_source_form_id;
  
  -- Create new form
  INSERT INTO forms (
    code,
    title,
    slug,
    description,
    fields,
    logo_url,
    require_consent,
    consent_heading,
    consent_text,
    consent_require_location,
    status,
    current_version,
    is_active,
    created_by,
    cloned_from,
    cloned_at,
    created_at,
    updated_at
  )
  VALUES (
    v_new_code,
    p_new_title,
    LOWER(REGEXP_REPLACE(p_new_title, '[^a-zA-Z0-9]+', '-', 'g')),
    CASE WHEN p_copy_settings THEN v_source_form.description ELSE '' END,
    CASE WHEN p_copy_questions THEN v_source_form.fields ELSE '[]'::jsonb END,
    CASE WHEN p_copy_logo THEN v_source_form.logo_url ELSE NULL END,
    CASE WHEN p_copy_settings THEN v_source_form.require_consent ELSE false END,
    CASE WHEN p_copy_settings THEN v_source_form.consent_heading ELSE 'การยินยอม (Consent)' END,
    CASE WHEN p_copy_settings THEN v_source_form.consent_text ELSE '' END,
    CASE WHEN p_copy_settings THEN v_source_form.consent_require_location ELSE false END,
    'draft',
    0,
    false,
    p_user_id,
    p_source_form_id,
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_form_id;
  
  -- Copy QR codes if requested
  IF p_copy_qr THEN
    INSERT INTO qr_codes (
      form_id, project_id, name, qr_slug, 
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      scan_count
    )
    SELECT 
      v_new_form_id, project_id, name || ' (Copy)', 
      LOWER(REGEXP_REPLACE(name || ' ' || v_new_code, '[^a-zA-Z0-9]+', '-', 'g')),
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      0
    FROM qr_codes
    WHERE form_id = p_source_form_id;
  END IF;
  
  RETURN v_new_form_id;
END;
$$;
```

## 📱 Custom Hooks

```typescript
// hooks/useFormVersions.ts
export function useFormVersions(formId: string) {
  const { data: versions, error } = useSWR(
    `/api/forms/${formId}/versions`,
    fetcher
  );
  
  const revertToVersion = async (version: number, notes?: string) => {
    const res = await fetch(`/api/forms/${formId}/revert`, {
      method: 'POST',
      body: JSON.stringify({ to_version: version, notes }),
    });
    return res.json();
  };
  
  return { versions, revertToVersion, error };
}

// hooks/useDuplicateForm.ts
export function useDuplicateForm() {
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  const duplicate = async (
    formId: string, 
    title: string, 
    options: DuplicateOptions
  ) => {
    setIsDuplicating(true);
    try {
      const res = await fetch(`/api/forms/${formId}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ title, options }),
      });
      return await res.json();
    } finally {
      setIsDuplicating(false);
    }
  };
  
  return { duplicate, isDuplicating };
}
```

## ⚠️ Edge Cases & Solutions

### 1. Revert แล้วแก้ไขน้อยมาก vs มาก
**ปัญหา:** ควรสร้าง version ใหม่อยู่ดีไหม?
**แก้ไข:** 
- สร้าง version ใหม่เสมอ (เพื่อความชัดเจน)
- ถ้าไม่แก้อะไรเลย ให้ user กด "Revert and Publish" โดยตรง

### 2. Duplicate ฟอร์มที่มี Draft อยู่
**ปัญหา:** ควร copy Draft หรือ Published version?
**แก้ไข:**
- Default: Copy Published version (เสถียรกว่า)
- Option: "Include pending changes" (copy draft ถ้ามี)

### 3. Form ที่ถูก Revert หลายรอบ
**ปัญหา:** Version history จะซับซ้อน
**แก้ไข:**
- แสดง revert chain (v5 → reverted from v3 → originally v2)
- ใช้สี/ไอคอนแยก revert versions

### 4. Duplicate แล้วต้นฉบับถูกลบ
**ปัญหา:** cloned_from ชี้ไป form ที่ไม่มีแล้ว
**แก้ไข:**
- ใช้ soft delete หรือ
- แสดง "Original form deleted" แทน link

## 📅 Timeline

| Phase | งาน | เวลา |
|-------|-----|------|
| **Phase 1** | Database + API | 2 วัน |
| | - Migration (form_versions เพิ่มฟิลด์) | |
| | - API: get versions, revert, duplicate | |
| **Phase 2** | UI: Version History | 2 วัน |
| | - History Tab | |
| | - Version list + Preview | |
| | - Revert flow | |
| **Phase 3** | UI: Duplicate | 1 วัน |
| | | |
| **รวม** | | **5 วัน** |

## 🎯 Integration กับ Draft Feature

```
รวม 3 features:
┌─────────────────────────────────────────────────────────────┐
│ 1. Draft Mode (from previous plan)                          │
│    - Edit published form → save as draft                    │
│    - Submit for review → Approve/Reject                     │
│                                                             │
│ 2. Version History + Revert (this plan)                     │
│    - View any version                                       │
│    - Revert to version → creates draft (integrate with #1) │
│                                                             │
│ 3. Duplicate/Clone (this plan)                              │
│    - Copy form → new draft form                             │
│    - Independent from original                              │
└─────────────────────────────────────────────────────────────┘

จุดเชื่อมต่อ:
- Revert จะสร้าง Draft (ใช้ draft system)
- Duplicate จะสร้าง Form ใหม่ (Draft status)
- ทั้งสองอันใช้งานร่วมกับ Draft Mode ได้
```

## ✅ Checklist ก่อนเริ่ม

- [ ] ตรวจสอบว่า form_versions มีข้อมูลครบทุก version
- [ ] ตรวจสอบ permission (ใคร revert ได้, ใคร duplicate ได้)
- [ ] ทดสอบกับฟอร์มที่มี version เยอะๆ (performance)
- [ ] Plan สำหรับ soft delete (ถ้าต้องการ)
