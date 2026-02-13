# ✅ Table Borders - Final Update

## สรุปการแก้ไข

### ย้อนกลับส่วนที่ไม่จำเป็น:
- ❌ Table outer border (กรอบนอก) - คืนค่าเดิม (ไม่มีกรอบหนา)
- ❌ Table header border - คืนค่าเดิม `border-b border-slate-300`
- ❌ Section dividers - คืนค่าเดิม `border-b border-slate-300`

### แก้ไขเฉพาะส่วนที่ต้องการ:
- ✅ **Row borders** - เพิ่ม `border-b border-slate-200` ให้ทุกแถว

---

## ผลลัพธ์

### ก่อนแก้ไข
```html
<tr className="hover:bg-slate-50 transition-colors">
  <!-- ไม่มี border ระหว่างแถว -->
</tr>
```

### หลังแก้ไข
```html
<tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
  <!-- มีเส้นแบ่งระหว่างแถว มองเห็นชัด -->
</tr>
```

---

## ไฟล์ที่มีการเพิ่ม Row Borders

- `src/app/admin/qr-codes/page.tsx` - QR Code list
- `src/app/admin/projects/page.tsx` - Projects list  
- `src/app/admin/submissions/[formId]/page.tsx` - Submissions detail
- `src/app/admin/submissions/page.tsx` - Submissions list
- `src/components/Analytics.tsx` - Analytics tables

---

## ระดับความเข้มปัจจุบัน

| ส่วน | Border Class | สถานะ |
|------|-------------|--------|
| Table outer | ไม่มี / บางตามเดิม | คืนค่าเดิม |
| Table header | `border-b border-slate-300` | คืนค่าเดิม |
| Table rows | `border-b border-slate-200` | ✅ เพิ่มใหม่ |
| Section dividers | `border-b border-slate-300` | คืนค่าเดิม |

---

**เรียบร้อยแล้ว! เฉพาะเส้นระหว่างแถวที่เพิ่มขึ้น ✅**
