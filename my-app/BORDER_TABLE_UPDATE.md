# ✅ Table Border Updates

## การเปลี่ยนแปลงเส้นตาราง (Table Borders)

### ก่อนแก้ไข
```tsx
// Table header
<tr className="border-b border-slate-300">

// Table rows  
<tr className="border-b border-slate-200">

// Table outer border (none or thin)
<table className="w-full">
```

### หลังแก้ไข
```tsx
// Table header - เข้มขึ้น
<tr className="border-b-2 border-slate-400">

// Table rows - เข้มขึ้น
<tr className="border-b border-slate-300">

// Table outer border - มีกรอบชัดเจน
<table className="border-collapse border-2 border-slate-400 w-full">
```

---

## ไฟล์ที่อัพเดต

### Tables
- `src/components/Analytics.tsx` - QR Code Performance table
- `src/app/admin/qr-codes/page.tsx` - QR Codes list table
- `src/app/admin/projects/page.tsx` - Projects table
- `src/app/admin/submissions/[formId]/page.tsx` - Submissions detail table
- `src/app/admin/submissions/page.tsx` - Submissions list table

### Components with divider borders
- `src/components/layout/Sidebar.tsx` - Sidebar dividers
- `src/components/FormBuilder.tsx` - Field dividers
- `src/components/DuplicateFormDialog.tsx` - Dialog dividers
- `src/app/admin/forms/[id]/EditFormPage.tsx` - Page dividers

---

## ระดับความเข้มของ Border

| ส่วน | Border Class | ความเข้ม |
|------|-------------|----------|
| Table outer | `border-2 border-slate-400` | เข้มมาก |
| Table header | `border-b-2 border-slate-400` | เข้มมาก |
| Table rows | `border-b border-slate-300` | ปานกลาง |
| Section dividers | `border-b-2 border-slate-400` | เข้มมาก |
| Card dividers | `border-b-2 border-slate-400` | เข้มมาก |

---

## ตัวอย่างผลลัพธ์

### Table ก่อนแก้ไข
```
┌─────────────────────────────────────┐
  Name    Scans    Submissions   <- header (บาง)
  ─────────────────────────────────
  QR1     100      50            <- row (บางมาก)
  QR2     200      80
```

### Table หลังแก้ไข
```
┌═════════════════════════════════════┐ ════ กรอบนอก (เข้ม)
║  Name    Scans    Submissions   ║ <- header (เข้ม)
╠═════════════════════════════════════╣ ════
║  QR1     100      50            ║ <- row (ปานกลาง)
├─────────────────────────────────────┤ ────
║  QR2     200      80            ║
└─────────────────────────────────────┘ ────
```

---

**เส้นตารางเข้มขึ้นแล้วทั้งโปรเจค! ✅**
