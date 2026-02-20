# Consent Stamp Feature

## ภาพรวม
ฟีเจอร์นี้ช่วยให้ผู้สร้างแบบสอบถามสามารถตั้งค่าให้ผู้ตอบต้องกด "ยินยอม" (Consent) ก่อนส่งคำตอบ พร้อมบันทึกหลักฐานการยินยอมแบบ Digital Stamp

### ความยืดหยุ่นในการตั้งค่า
- ✅ เปิด/ปิด Consent ได้
- ✅ แก้ไขข้อความยินยอมได้
- ✅ เลือกว่าจะขอตำแหน่ง GPS หรือไม่
- ✅ บันทึก IP Address เสมอ (ไม่ต้องตั้งค่า)

## ข้อมูลที่บันทึก

| ฟิลด์ | คำอธิบาย | ตัวอย่าง |
|-------|---------|---------|
| `require_consent` | เปิดใช้งาน consent หรือไม่ | `true` |
| `consent_text` | ข้อความแสดงความยินยอม | `"ข้าพเจ้ายินยอม..."` |
| `consent_require_location` | ขอตำแหน่ง GPS หรือไม่ | `true` |

### ข้อมูลที่บันทึกใน Submissions

| ฟิลด์ | คำอธิบาย | ตัวอย่าง |
|-------|---------|---------|
| `consent_given` | ผู้ตอบกดยินยอมหรือไม่ | `true` |
| `consented_at` | เวลาที่กดยินยอม (ISO 8601) | `2024-01-15T10:30:00Z` |
| `consent_ip` | IP Address ของผู้ตอบ | `192.168.1.1` |
| `consent_location` | ตำแหน่ง GPS (ถ้าอนุญาตและตั้งค่าให้ขอ) | `{"latitude": 13.7563, "longitude": 100.5018, "accuracy": 10}` |

## การตั้งค่าใน Form Builder

1. เปิด "การตั้งค่าความยินยอม (Consent)" ที่ด้านล่างของฟอร์ม
2. ติ๊ก "ต้องการให้ผู้ตอบกดยินยอมก่อนส่ง"
3. แก้ไขข้อความยินยอมตามต้องการ
4. (Optional) ติ๊ก "ขอตำแหน่งที่ตั้ง (GPS) จากผู้ตอบ" หากต้องการบันทึกตำแหน่ง

## ประสบการณ์ผู้ใช้

### หน้าแบบสอบถาม (Form Renderer)
- แสดงกล่อง Consent สีเขียวพร้อม checkbox
- ผู้ตอบต้อง tick checkbox ก่อนถึงจะกดส่งได้
- แสดง IP Address ที่จะถูกบันทึก
- หากตั้งค่าให้ขอตำแหน่ง:
  - ระบบจะขออนุญาตเข้าถึงตำแหน่ง (ถ้า browser รองรับ)
  - แสดงสถานะ: กำลังขอตำแหน่ง / ได้รับตำแหน่ง / ถูกปฏิเสธ

### ตัวอย่างข้อความยินยอม
```
ข้าพเจ้ายินยอมให้เก็บข้อมูลส่วนบุคคลตามที่ระบุในแบบสอบถามนี้ 
และข้าพเจ้าเข้าใจว่าข้อมูลจะถูกใช้เพื่อวัตถุประสงค์ตามที่แจ้งไว้เท่านั้น
```

## การ Query ข้อมูล Consent

```sql
-- ดู submissions ที่มี consent
SELECT 
  s.id,
  s.submitted_at,
  s.consent_given,
  s.consented_at,
  s.consent_ip,
  s.consent_location->>'latitude' as lat,
  s.consent_location->>'longitude' as lng
FROM submissions s
WHERE s.form_id = 'your-form-id'
  AND s.consent_given = true;

-- ดู submissions ที่ไม่มี consent (ถ้าตั้งค่า consent เป็น optional)
SELECT * FROM submissions 
WHERE form_id = 'your-form-id' 
  AND (consent_given = false OR consent_given IS NULL);
```

## ความเป็นส่วนตัว (Privacy)

1. **IP Address**: ดึงจาก https://api.ipify.org (public IP)
2. **Location**: ใช้ Browser Geolocation API ต้องขออนุญาตผู้ใช้ก่อน
3. **การเข้ารหัส**: ข้อมูลทั้งหมดส่งผ่าน HTTPS
4. **การเก็บรักษา**: เก็บตามมาตรฐาน PDPA/GDPR

## การแก้ไขปัญหา

### Location ไม่ทำงาน
- ต้องใช้ HTTPS (ไม่ทำงานบน HTTP)
- ผู้ใช้ต้องอนุญาตการเข้าถึงตำแหน่ง
- บาง browser อาจบล็อก geolocation

### IP ไม่แสดง
- ตรวจสอบการเชื่อมต่อ internet
- api.ipify.org อาจถูกบล็อกโดย Firewall

## สถาปัตยกรรม

```
┌─────────────────┐     ┌──────────────────────────────┐
│   Form Builder  │────▶│         forms table          │
│  (Admin config) │     │  require_consent             │
│                 │     │  consent_text                │
│                 │     │  consent_require_location ◄──┼── ตั้งค่าขอ GPS?
└─────────────────┘     └──────────────────────────────┘
                                    │
                                    ▼
┌─────────────────┐     ┌──────────────────────────────┐
│  Form Renderer  │────▶│  User tick checkbox          │
│  (User view)    │     │  Get IP Address (เสมอ)       │
│                 │     │  Get GPS (ถ้าตั้งค่า)         │
└─────────────────┘     └──────────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     submissions      │
                         │  consent_given       │
                         │  consent_ip          │
                         │  consent_location    │
                         │  consented_at        │
                         └──────────────────────┘
```
