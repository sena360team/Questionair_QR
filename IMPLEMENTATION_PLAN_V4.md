# Implementation Plan: Form Editor UI V4

## Overview
ปรับปรุง UI หน้า Form Editor เป็น Version 4 ที่มีการจัดกลุ่มปุ่มและ Tabs ที่ชัดเจน

---

## Pre-Implementation Checklist

- [ ] Backup โค้ดปัจจุบัน (git commit/push)
- [ ] สร้าง branch ใหม่ `feature/form-editor-v4`
- [ ] แจ้งทีมงานว่ามีการเปลี่ยนแปลง UI
- [ ] เตรียม environment สำหรับทดสอบ

---

## Phase 1: วิเคราะห์ Component ที่ต้องแก้ไข

### 1.1 ไฟล์ที่ต้องแก้ไข

| ไฟล์ | ส่วนที่เปลี่ยน | ความยาก |
|------|---------------|----------|
| `src/app/forms/[id]/page.tsx` หรือ `FormBuilder.tsx` | Layout หลัก | สูง |
| `src/components/FormHeader.tsx` | Header, Breadcrumb, ชื่อฟอร์ม | กลาง |
| `src/components/FormTabs.tsx` หรือสร้างใหม่ | Tabs navigation | กลาง |
| `src/components/DraftAlert.tsx` หรือสร้างใหม่ | Draft alert banner | ต่ำ |
| `src/components/FormActions.tsx` | ปุ่ม Actions (ดูตัวอย่าง, บันทึก, Publish) | กลาง |

### 1.2 Component ใหม่ที่ต้องสร้าง

```typescript
// components/form-editor/
├── DraftAlert.tsx          // Alert banner ด้านบน
├── FormHeaderV4.tsx        // Header แบบ V4 (breadcrumb + ชื่อ + ปุ่มรอง)
├── FormTabs.tsx            // Tabs: เนื้อหา, ตั้งค่า, QR, ประวัติ
├── ActionBar.tsx           // ปุ่มหลัก (ดูตัวอย่าง, บันทึก draft, Publish)
└── index.ts                // Export รวม
```

---

## Phase 2: สร้าง Components ใหม่

### Step 2.1: DraftAlert Component

```tsx
// src/components/form-editor/DraftAlert.tsx
interface DraftAlertProps {
  currentVersion: number;
}

export function DraftAlert({ currentVersion }: DraftAlertProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-t-xl px-4 py-3 flex items-center gap-3">
      <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <p className="text-sm text-amber-800">
        <span className="font-medium">กำลังแก้ไข Draft</span>
        <span className="hidden sm:inline"> · ฟอร์มที่แสดงผลให้ผู้ตอบแบบสอบถามเห็นคือ V{currentVersion} (Publish)</span>
      </p>
    </div>
  );
}
```

### Step 2.2: FormHeaderV4 Component

```tsx
// src/components/form-editor/FormHeaderV4.tsx
interface FormHeaderV4Props {
  formCode: string;
  formTitle: string;
  onCopy: () => void;
  onDeleteDraft: () => void;
  hasDraft: boolean;
}

export function FormHeaderV4({ 
  formCode, 
  formTitle, 
  onCopy, 
  onDeleteDraft,
  hasDraft 
}: FormHeaderV4Props) {
  return (
    <div className="px-4 py-4 border-b border-slate-100">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-2">
        <button className="text-slate-500 hover:text-slate-700 transition-colors">
          ฟอร์ม
        </button>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
        </svg>
        <span className="text-slate-900 font-medium">{formCode}</span>
      </div>
      
      {/* Form Name & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 leading-tight">
          {formTitle}
        </h1>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={onCopy}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            คัดลอก
          </button>
          {hasDraft && (
            <button 
              onClick={onDeleteDraft}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              ลบ Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 2.3: FormTabs Component

```tsx
// src/components/form-editor/FormTabs.tsx
type TabType = 'content' | 'settings' | 'qr' | 'history';

interface FormTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'content' as TabType, label: 'เนื้อหา', icon: DocumentIcon },
  { id: 'settings' as TabType, label: 'ตั้งค่า', icon: CogIcon },
  { id: 'qr' as TabType, label: 'QR Code', icon: QRIcon },
  { id: 'history' as TabType, label: 'ประวัติ', icon: ClockIcon },
];

export function FormTabs({ activeTab, onTabChange }: FormTabsProps) {
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-3 py-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors
            ${activeTab === tab.id 
              ? 'text-green-600 border-b-2 border-green-600' 
              : 'text-slate-500 hover:text-slate-700'}
          `}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
```

### Step 2.4: ActionBar Component

```tsx
// src/components/form-editor/ActionBar.tsx
interface ActionBarProps {
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  hasChanges: boolean;
  nextVersion: number;
}

export function ActionBar({
  onPreview,
  onSaveDraft,
  onPublish,
  isPublishing,
  hasChanges,
  nextVersion
}: ActionBarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* ดูตัวอย่าง */}
      <button
        onClick={onPreview}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all"
      >
        <EyeIcon className="w-4 h-4" />
        <span className="hidden sm:inline">ดูตัวอย่าง</span>
      </button>
      
      {/* บันทึก draft */}
      <button
        onClick={onSaveDraft}
        disabled={!hasChanges}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SaveIcon className="w-4 h-4" />
        <span className="hidden sm:inline">บันทึก draft</span>
      </button>
      
      {/* Publish */}
      <button
        onClick={onPublish}
        disabled={isPublishing}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CheckIcon className="w-4 h-4" />
        <span>Publish</span>
        <span className="hidden sm:inline text-green-100">v{nextVersion}</span>
      </button>
    </div>
  );
}
```

---

## Phase 3: ประกอบ Components

### Step 3.1: สร้างหน้า FormEditorV4

```tsx
// src/app/forms/[id]/FormEditorV4.tsx หรือในหน้า page.tsx
'use client';

import { useState } from 'react';
import { DraftAlert } from '@/components/form-editor/DraftAlert';
import { FormHeaderV4 } from '@/components/form-editor/FormHeaderV4';
import { FormTabs } from '@/components/form-editor/FormTabs';
import { ActionBar } from '@/components/form-editor/ActionBar';

export function FormEditorV4({ formId }: { formId: string }) {
  const [activeTab, setActiveTab] = useState('content');
  const [isPublishing, setIsPublishing] = useState(false);
  
  // ... hooks, data fetching
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Draft Alert - แสดงเมื่อมี Draft */}
      {hasDraft && (
        <DraftAlert currentVersion={currentVersion} />
      )}
      
      {/* Main Card */}
      <div className={`
        bg-white shadow-sm border border-slate-200
        ${hasDraft ? 'rounded-b-xl border-t-0' : 'rounded-xl'}
      `}>
        {/* Header */}
        <FormHeaderV4
          formCode={form.code}
          formTitle={form.title}
          onCopy={handleCopy}
          onDeleteDraft={handleDeleteDraft}
          hasDraft={hasDraft}
        />
        
        {/* Tabs + Actions */}
        <div className="px-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 -mb-px">
            <FormTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="sm:ml-auto py-2 sm:py-0">
              <ActionBar
                onPreview={handlePreview}
                onSaveDraft={handleSaveDraft}
                onPublish={handlePublish}
                isPublishing={isPublishing}
                hasChanges={hasChanges}
                nextVersion={nextVersion}
              />
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-4 sm:p-6">
          {activeTab === 'content' && <FormContentEditor form={form} />}
          {activeTab === 'settings' && <FormSettings form={form} />}
          {activeTab === 'qr' && <QRCodeSection form={form} />}
          {activeTab === 'history' && <VersionHistory form={form} />}
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 4: Testing

### 4.1 Feature Testing Checklist

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| Draft Alert | มี Draft | แสดง alert ด้านบน |
| Draft Alert | ไม่มี Draft | ไม่แสดง alert, card มี border รอบ |
| Header | แสดงชื่อฟอร์มยาว | ไม่ truncate, แสดงเต็ม |
| Header | คลิก "คัดลอก" | Copy form ID หรือ clone form |
| Header | คลิก "ลบ Draft" | แสดง confirm dialog |
| Tabs | คลิกแต่ละ tab | Content เปลี่ยนตาม tab |
| Tabs | Active tab | มี underline สีเขียว |
| Actions | คลิก "ดูตัวอย่าง" | เปิด preview modal หรือหน้าใหม่ |
| Actions | คลิก "บันทึก draft" | Save draft, แสดง toast success |
| Actions | คลิก "Publish" | Publish แล้ว refresh หรือ redirect |
| Responsive | Mobile (< 640px) | ซ่อนข้อความปุ่มรอง, แสดง icon |
| Responsive | Tablet (640-1024px) | แสดงครบทุก element |
| Responsive | Desktop (> 1024px) | แสดงครบทุก element |

### 4.2 Accessibility Testing

- [ ] ใช้ keyboard navigation (Tab, Enter, Space) ได้ครบทุกปุ่ม
- [ ] Screen reader อ่านชื่อปุ่มได้ถูกต้อง
- [ ] Focus states ชัดเจนทุก interactive element

### 4.3 Browser Testing

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

---

## Phase 5: Deployment

### 5.1 Staged Deployment

```
Step 1: Deploy to Staging
  → ทดสอบทุก feature บน staging
  → ให้ทีมงานรีวิว
  → แก้ไข bugs ถ้ามี

Step 2: Deploy to Production (Canary)
  → Deploy ให้ 10% ของ users
  → Monitor errors และ feedback
  → รอ 24 ชั่วโมง

Step 3: Full Production Deploy
  → Deploy 100% ถ้าไม่มีปัญหา
  → Monitor ต่ออีก 48 ชั่วโมง
```

### 5.2 Monitoring

- Error tracking (Sentry/LogRocket)
- Performance metrics (Core Web Vitals)
- User feedback channel

---

# Rollback Plan

## Scenario ที่ต้อง Rollback

1. **Critical Bug**: ฟอร์มไม่สามารถบันทึกหรือ publish ได้
2. **UX Issue ร้ายแรง**: Users งงหรือใช้งานไม่ได้
3. **Performance Issue**: หน้าโหลดช้าผิดปกติ
4. **Browser Compatibility**: พังบน browser หลัก

## Rollback Steps

### Option 1: Git Revert (แนะนำ)

```bash
# 1. Revert commit
 git revert <commit-hash-of-v4>

# 2. Push
 git push origin main

# 3. Deploy ทันที
 npm run deploy
```

### Option 2: Feature Flag (ถ้าเตรียมไว้)

```tsx
// ในโค้ด
const { useV4 } = useFeatureFlags();

return useV4 ? <FormEditorV4 /> : <FormEditorOld />;
```

ปิด V4 ผ่าน dashboard:
```
Dashboard → Feature Flags → form-editor-v4 → OFF
```

### Option 3: Hotfix (กรณีฉุกเฉิน)

```bash
# 1. สร้าง hotfix branch จาก commit ก่อน V4
git checkout -b hotfix/revert-v4 <commit-before-v4>

# 2. Deploy ทันที
npm run deploy:production
```

## Rollback Checklist

- [ ] แจ้งทีมงานว่ามีการ rollback
- [ ] บันทึกเหตุผลการ rollback
- [ ] สร้าง incident report
- [ ] แก้ไขปัญหาแล้ว deploy ใหม่

---

# Timeline

| Phase | ระยะเวลา | ผู้รับผิดชอบ |
|-------|----------|--------------|
| Phase 1: Analysis | 1 วัน | Developer |
| Phase 2: Create Components | 2 วัน | Developer |
| Phase 3: Assembly | 1 วัน | Developer |
| Phase 4: Testing | 1 วัน | QA + Developer |
| Phase 5: Deployment | 2-3 วัน | DevOps |
| **รวม** | **7-8 วัน** | |

---

# Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Users งงกับ UI ใหม่ | สูง | ปานกลาง | แนะนำผ่าน tooltip, help text |
| Bug ในการ publish | สูง | ต่ำ | Testing ละเอียด, rollback plan |
| Responsive ไม่สมบูรณ์ | กลาง | ปานกลาง | Test บน real devices |
| Performance regression | กลาง | ต่ำ | Monitor Core Web Vitals |

---

# Post-Implementation Review

หลัง deploy 1 สัปดาห์:

- [ ] รวบรวม user feedback
- [ ] วัด metrics (เวลาที่ใช้ publish, error rate)
- [ ] ประชุมทีม review
- [ ] ปรับปรุงตาม feedback
