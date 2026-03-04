# UTM & Project Data Flow

ข้อมูล UTM และ Project ID ที่ถูกส่งไปในระบบ

---

## 📊 Data Being Sent to Submission API

### When user submits a form via QR Code:

**POST** `/api/forms/{form-id}/submissions`

```json
{
  "responses": {
    "field-1": "user response 1",
    "field-2": "user response 2"
  },
  "qr_code_id": "qr-uuid-123",
  "project_id": "project-uuid-456",
  "utm_source": "facebook",
  "utm_medium": "social",
  "utm_campaign": "summer-2024",
  "utm_content": "banner-ad",
  "utm_term": "customer-feedback",
  "metadata": {
    "consent_given": true,
    "consent_ip": "192.168.1.1",
    "consent_location": {
      "latitude": 13.7563,
      "longitude": 100.5018
    },
    "consented_at": "2026-02-25T10:00:00Z"
  }
}
```

**ใช่ครับ** ✅ **ส่งชื่อโครงการและ ID ไปแล้ว**
- ✅ `project_id` - ถูกส่งไป
- ✅ `qr_code_id` - เพื่อให้สามารถ join ข้อมูล project ได้
- ✅ `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` - ทั้งหมดถูกส่ง

---

## 🔄 Complete Data Flow

### 1️⃣ User Scans QR Code

QR Code URL example:
```
https://example.com/qr/qr-001?utm_source=facebook&utm_medium=social&utm_campaign=summer-2024
```

QR Code Data (includes project):
```json
{
  "id": "qr-uuid-123",
  "form_id": "form-uuid",
  "project_id": "project-uuid-456",
  "name": "QR-001",
  "qr_slug": "qr-001",
  "utm_source": "facebook",
  "utm_medium": "social",
  "utm_campaign": "summer-2024",
  "utm_content": "banner-ad",
  "utm_term": "customer-feedback",
  "project": {
    "id": "project-uuid-456",
    "code": "PROJ-001",
    "name": "Summer Campaign 2024"
  }
}
```

---

### 2️⃣ System Stores UTM in Session

**File**: `src/app/qr/[slug]/page.tsx` (lines 44-52)

```typescript
const utmParams = {
  utm_source: searchParams.get('utm_source') || qrData.utm_source || 'qr_code',
  utm_medium: searchParams.get('utm_medium') || qrData.utm_medium || 'offline',
  utm_campaign: searchParams.get('utm_campaign') || qrData.utm_campaign || undefined,
  utm_content: searchParams.get('utm_content') || qrData.utm_content || undefined,
  utm_term: searchParams.get('utm_term') || qrData.utm_term || undefined,
};
storeUTMInSession(utmParams);
```

Priority (from highest to lowest):
1. URL query parameters
2. QR Code UTM settings
3. Default values

---

### 3️⃣ User Fills Form

Form page retrieves and shows form content.

---

### 4️⃣ User Submits Form

**File**: `src/app/form/[slug]/page.tsx` (lines 82-159)

#### 4A. Extract QR Code Data (lines 95-107)
```typescript
let qrCodeId: string | null = null;
let projectId: string | null = null;

const currentQrSlug = searchParams.get('_qr') || qrSlug;
if (currentQrSlug) {
  const qrRes = await fetch(`/api/qr-codes/${currentQrSlug}`);
  if (qrRes.ok) {
    const qrData = await qrRes.json();
    qrCodeId = qrData.id;                    // ✅ QR Code ID
    projectId = qrData.project_id;           // ✅ PROJECT ID
    if (!finalUtmParams.utm_source && qrData.utm_source)
      finalUtmParams.utm_source = qrData.utm_source;
    // ... merge other UTM params
  }
}
```

#### 4B. Send to API (lines 110-129)
```typescript
const res = await fetch(`/api/forms/${form.id}/submissions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    responses: cleanResponses,
    qr_code_id: qrCodeId,              // ✅ QR Code ID
    project_id: projectId,              // ✅ PROJECT ID
    utm_source: finalUtmParams.utm_source || null,      // ✅
    utm_medium: finalUtmParams.utm_medium || null,      // ✅
    utm_campaign: finalUtmParams.utm_campaign || null,  // ✅
    utm_content: finalUtmParams.utm_content || null,    // ✅
    utm_term: finalUtmParams.utm_term || null,          // ✅
    metadata: {
      consent_given: consentData?.given || false,
      consent_ip: consentData?.ip || null,
      consent_location: consentData?.location || null,
      consented_at: consentData?.at || null,
    },
  }),
});
```

---

### 5️⃣ API Saves to Database

**File**: `src/app/api/forms/[id]/submissions/route.ts` (lines 97-112)

```typescript
const submission = await prisma.submission.create({
  data: {
    form_id: form.id,
    form_version: form.current_version,
    qr_code_id: body.qr_code_id || null,        // ✅ Stored
    project_id: body.project_id || null,        // ✅ Stored
    responses: body.responses || {},
    utm_source: body.utm_source || null,        // ✅ Stored
    utm_medium: body.utm_medium || null,        // ✅ Stored
    utm_campaign: body.utm_campaign || null,    // ✅ Stored
    utm_content: body.utm_content || null,      // ✅ Stored
    utm_term: body.utm_term || null,            // ✅ Stored
    fingerprint: body.fingerprint || null,
    metadata: body.metadata || null,
  },
});
```

---

### 6️⃣ Data in Database

**Submission Record:**
```sql
{
  id: "submission-uuid",
  form_id: "form-uuid",
  qr_code_id: "qr-uuid-123",           -- ✅ QR Code ID
  project_id: "project-uuid-456",      -- ✅ PROJECT ID
  utm_source: "facebook",               -- ✅
  utm_medium: "social",                 -- ✅
  utm_campaign: "summer-2024",          -- ✅
  utm_content: "banner-ad",             -- ✅
  utm_term: "customer-feedback",        -- ✅
  responses: {...},
  submitted_at: "2026-02-25T10:00:00Z"
}
```

---

## 📋 Database Schema

### Submission Table Columns
```sql
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  form_id UUID NOT NULL,
  qr_code_id UUID,              -- ✅ QR Code reference
  project_id UUID,              -- ✅ Project reference

  -- UTM Parameters
  utm_source VARCHAR(255),      -- ✅ Source (facebook, google, etc)
  utm_medium VARCHAR(255),      -- ✅ Medium (social, email, paid, etc)
  utm_campaign VARCHAR(255),    -- ✅ Campaign name
  utm_content VARCHAR(255),     -- ✅ Content identifier
  utm_term VARCHAR(255),        -- ✅ Search keyword

  -- Other fields
  responses JSONB,
  metadata JSONB,
  submitted_at TIMESTAMP,
  ...
);
```

---

## 🔗 Getting Project Data

### Option 1: Direct from submission
```sql
SELECT project_id FROM submissions WHERE id = '{submission-id}';
```

### Option 2: Via QR Code
```sql
SELECT p.*
FROM submissions s
JOIN qr_codes q ON s.qr_code_id = q.id
JOIN projects p ON q.project_id = p.id
WHERE s.id = '{submission-id}';
```

### Option 3: Using API with project_id filter

**GET** `/api/forms/{form-id}/submissions?project_id=project-uuid-456`

Response includes:
```json
{
  "form": {...},
  "submissions": [
    {
      "id": "submission-uuid",
      "project_id": "project-uuid-456",
      "utm_source": "facebook",
      "utm_medium": "social",
      "utm_campaign": "summer-2024",
      "utm_content": "banner-ad",
      "utm_term": "customer-feedback",
      "responses": {...},
      "qr_code": {
        "id": "qr-uuid-123",
        "name": "QR-001",
        "qr_slug": "qr-001"
      }
    }
  ],
  "pagination": {...}
}
```

---

## 📊 Analytics Query Examples

### Example 1: Submissions by Project
```sql
SELECT
  p.id,
  p.code,
  p.name,
  COUNT(s.id) as submission_count
FROM submissions s
LEFT JOIN projects p ON s.project_id = p.id
GROUP BY p.id, p.code, p.name
ORDER BY submission_count DESC;
```

### Example 2: Submissions by UTM Campaign
```sql
SELECT
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(*) as count
FROM submissions
WHERE submitted_at >= NOW() - INTERVAL '30 days'
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY count DESC;
```

### Example 3: Submission Conversion by Project & UTM
```sql
SELECT
  p.name,
  s.utm_source,
  s.utm_campaign,
  COUNT(*) as total_submissions,
  COUNT(DISTINCT s.id) as unique_responses
FROM submissions s
LEFT JOIN projects p ON s.project_id = p.id
WHERE s.submitted_at >= NOW() - INTERVAL '60 days'
GROUP BY p.name, s.utm_source, s.utm_campaign
ORDER BY total_submissions DESC;
```

---

## ✅ Summary

**โปรแกรมส่งข้อมูลต่อไปนี้:**

| Data | Sent | Stored | Retrievable |
|------|------|--------|-------------|
| Project ID | ✅ Yes | ✅ Yes | ✅ Yes |
| Project Name | ✅ Via relation | ✅ Via join | ✅ Yes |
| QR Code ID | ✅ Yes | ✅ Yes | ✅ Yes |
| utm_source | ✅ Yes | ✅ Yes | ✅ Yes |
| utm_medium | ✅ Yes | ✅ Yes | ✅ Yes |
| utm_campaign | ✅ Yes | ✅ Yes | ✅ Yes |
| utm_content | ✅ Yes | ✅ Yes | ✅ Yes |
| utm_term | ✅ Yes | ✅ Yes | ✅ Yes |
| Consent Data | ✅ Yes | ✅ Yes | ✅ Yes |
| IP Address | ✅ Via metadata | ✅ Via metadata | ✅ Yes |
| Location | ✅ Via metadata | ✅ Via metadata | ✅ Yes |

---

## 🔍 Debug: Check What Was Sent

### 1. Check Submission Record
```sql
SELECT
  id,
  project_id,
  qr_code_id,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term,
  submitted_at
FROM submissions
ORDER BY submitted_at DESC
LIMIT 10;
```

### 2. Check with QR Code & Project Info
```sql
SELECT
  s.id as submission_id,
  q.name as qr_name,
  p.name as project_name,
  s.utm_source,
  s.utm_medium,
  s.utm_campaign,
  s.submitted_at
FROM submissions s
LEFT JOIN qr_codes q ON s.qr_code_id = q.id
LEFT JOIN projects p ON s.project_id = p.id
ORDER BY s.submitted_at DESC;
```

---

## 📝 Notes

- **Project name** is not directly stored in submissions table, but can be retrieved via `project_id` → join with `projects` table
- All UTM parameters are **optional** - they'll be NULL if not provided
- Default UTM values: `utm_source = 'qr_code'`, `utm_medium = 'offline'` if from QR
- Project ID comes from QR Code's `project_id` field
- QR Code can have its own UTM settings, which are merged with URL parameters
