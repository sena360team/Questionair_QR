# CSS API - ข้อมูล UTM ที่ส่ง

ตรวจสอบว่า UTM Source และ UTM Medium ถูกส่งไปยัง CSS API หรือไม่

---

## 📊 สถานะปัจจุบัน

### ✅ ส่งไป CSS API แล้ว:
- ✅ **UTM Medium** → ส่งไปเป็น `project_id`
- ❌ **UTM Source** → **ไม่ได้ส่ง**

---

## 📋 ข้อมูลที่ส่งไปยัง CSS API ในปัจจุบัน

**File**: `src/lib/css-api.ts` (lines 64-78)

```typescript
const payload: any = {
  project_id: qrData?.utm_medium || 'default',    // ✅ UTM Medium
  contact_channel_id: contactChannelId,
  job_detail: jobDetail,
  user_created: userCreated,
  customer_name: customerName,
  telephone: telephone,
  email: email,
  house_name: houseName,
};
```

### ส่งไปยัง CSS API:
```json
{
  "project_id": "PROJ-001",              // ✅ จาก UTM Medium
  "contact_channel_id": "channel-123",
  "job_detail": "The service was slow",
  "customer_name": "John Doe",
  "telephone": "0812345678",
  "email": "john@example.com",
  "user_created": "user-id-456",
  "house_name": "Building A"
}
```

---

## 🔄 ข้อมูลที่ได้รับแต่ไม่ส่ง

### จาก Form Page:
```typescript
// src/app/form/[slug]/page.tsx (line 144)
sendToCSS(
  cleanResponses,
  fieldMapping,
  contactChannelId,
  userCreated,
  {
    utm_medium: finalUtmParams.utm_medium,  // ✅ ส่งเข้าไป
    utm_source: finalUtmParams.utm_source   // ❌ ส่งเข้าไป แต่ไม่ได้ใช้
  }
);
```

### ใน sendToCSS function:
```typescript
// src/lib/css-api.ts (lines 40)
export async function sendToCSS(
  answers: SubmissionAnswers,
  fieldMapping: CSSFieldMapping,
  contactChannelId: string,
  userCreated: string,
  qrData?: QRData  // ← utm_source อยู่ที่นี่ แต่ไม่ได้ส่งไปยัง CSS API
): Promise<{ success: boolean; error?: string; data?: any }>
```

---

## 💡 ปัญหาและแนวทางแก้ไข

### ปัญหา:
- ✅ UTM Medium ถูกส่งแล้ว (เป็น project_id)
- ❌ UTM Source ไม่ถูกส่ง

### วิธีแก้ไข (ถ้าต้องการส่ง):

**File**: `src/lib/css-api.ts` - แก้ไข payload (lines 64-78)

```typescript
// เพิ่ม utm_source ลงใน payload
const payload: any = {
  project_id: qrData?.utm_medium || 'default',
  contact_channel_id: contactChannelId,
  job_detail: typeof jobDetail === 'string' ? jobDetail : JSON.stringify(jobDetail),
  user_created: userCreated,
  utm_source: qrData?.utm_source || undefined,  // ← เพิ่มบรรทัดนี้
};
```

ผลลัพธ์ที่ส่งไป CSS API:
```json
{
  "project_id": "PROJ-001",
  "utm_source": "facebook",                // ← ใหม่
  "contact_channel_id": "channel-123",
  "job_detail": "...",
  "customer_name": "...",
  "telephone": "...",
  "email": "...",
  "user_created": "..."
}
```

---

## 🔍 ตรวจสอบ Log

### ดู Log ที่ส่งไปยัง CSS API:
```typescript
// src/lib/css-api.ts (line 80)
console.log('[CSS API] Sending payload:', payload);
```

Open DevTools → Console → ดูว่า payload มีอะไรบ้าง

### ตัวอย่าง Console Output:
```
[CSS API] Sending payload: {
  project_id: "PROJ-001",
  contact_channel_id: "channel-123",
  job_detail: "The service was slow",
  user_created: "user-id-456",
  customer_name: "John Doe",
  telephone: "0812345678",
  email: "john@example.com",
  house_name: "Building A"
}
```

---

## 📊 ข้อมูล Flow ของ UTM

### 1. QR Code สแกน:
```json
{
  "utm_source": "facebook",      // ← จาก QR code UTM settings
  "utm_medium": "PROJ-001",      // ← จาก QR code UTM settings
  "utm_campaign": "summer-2024"
}
```

### 2. เก็บใน Session:
```typescript
storeUTMInSession({
  utm_source: "facebook",
  utm_medium: "PROJ-001",
  utm_campaign: "summer-2024"
});
```

### 3. Form Page ดึงออก:
```typescript
const finalUtmParams = {
  utm_source: "facebook",      // ← ดึง
  utm_medium: "PROJ-001",      // ← ดึง
  utm_campaign: "summer-2024"
};
```

### 4. ส่งไปยัง Submission API:
```json
{
  "utm_source": "facebook",      // ✅ ส่ง
  "utm_medium": "PROJ-001",      // ✅ ส่ง
  "utm_campaign": "summer-2024", // ✅ ส่ง
  "project_id": "PROJ-001"       // ✅ ส่ง
}
```

### 5. ส่งไปยัง CSS API:
```json
{
  "project_id": "PROJ-001",      // ✅ จาก utm_medium
  "utm_source": "facebook",      // ❌ ไม่ส่ง (แต่ code รับมาแล้ว)
  "contact_channel_id": "...",
  "job_detail": "..."
}
```

---

## 🎯 สรุป

| ข้อมูล | Submission API | CSS API |
|--------|----------------|---------|
| utm_source | ✅ ส่ง | ❌ ไม่ส่ง |
| utm_medium | ✅ ส่ง | ✅ ส่งเป็น project_id |
| utm_campaign | ✅ ส่ง | ❌ ไม่ส่ง |
| utm_content | ✅ ส่ง | ❌ ไม่ส่ง |
| utm_term | ✅ ส่ง | ❌ ไม่ส่ง |
| project_id | ✅ ส่ง | ✅ ส่ง |
| qr_code_id | ✅ ส่ง | ❌ ไม่ส่ง |

---

## ❓ คำถาม

**คุณต้องการให้ส่ง utm_source ไปยัง CSS API หรือไม่?**

- ✅ **Yes** → ต้องแก้ไข `src/lib/css-api.ts` (บรรทัด 64-78)
- ❌ **No** → ไม่ต้องแก้ (ปัจจุบันส่งแค่ project_id)

---

## 📝 Mapping ทีมคุณใช้

ถ้าทีมคุณใช้:
- **UTM Source** = ชื่อโครงการ (เช่น "facebook", "customer-service")
- **UTM Medium** = รหัสโครงการ (เช่น "PROJ-001")

→ ปัจจุบัน CSS API ได้รับแค่ **รหัสโครงการ** (utm_medium)
→ หากต้องการ **ชื่อโครงการ** ต้องเพิ่มการส่ง utm_source
