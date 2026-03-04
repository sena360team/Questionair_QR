# API Reference - Questionnaire QR System

สารเสร็จสิ้นการ reference API ทั้งหมดสำหรับระบบ Questionnaire QR พร้อมรูปแบบ Request/Response

---

## 1. Forms API

### GET /api/forms
ดึงรายการแบบสอบถามทั้งหมด พร้อม QR codes count และ submissions count

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "FORM001",
    "slug": "form-001",
    "title": "Customer Feedback",
    "description": "...",
    "fields": [],
    "is_active": true,
    "allow_multiple_responses": true,
    "status": "published",
    "current_version": 1,
    "draft_version": null,
    "theme": "card-groups",
    "banner_color": "blue",
    "accent_color": "sky",
    "logo_url": null,
    "require_consent": false,
    "css_integration_enabled": false,
    "css_field_mapping": {},
    "created_at": "2026-02-25T10:00:00Z",
    "updated_at": "2026-02-25T10:00:00Z",
    "has_draft": false,
    "qr_codes": [{ "count": 5 }],
    "submissions": [{ "count": 42 }]
  }
]
```

---

### POST /api/forms
สร้างแบบสอบถามใหม่

**Request Body:**
```json
{
  "code": "FORM001",
  "slug": "form-001",
  "title": "Customer Feedback",
  "description": "Optional description",
  "fields": [],
  "is_active": true,
  "allow_multiple_responses": true,
  "status": "draft"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "code": "FORM001",
    "slug": "form-001",
    "title": "Customer Feedback",
    ...
  }
}
```

**Error Cases:**
- `400` - code, slug, title are required
- `409` - Form code or slug already exists

---

### GET /api/forms/[id]
ดึงแบบสอบถามตาม ID, slug, หรือ code

**Path Parameters:**
- `id` - Form ID, slug, หรือ code

**Response:**
```json
{
  "id": "uuid",
  "code": "FORM001",
  "slug": "form-001",
  "title": "Customer Feedback",
  "fields": [
    {
      "id": "field1",
      "name": "email",
      "label": "Email Address",
      "type": "text",
      "required": true,
      "_versionAdded": 1
    }
  ],
  "versions": [
    {
      "id": "version-uuid",
      "version": 1,
      "status": "published",
      "fields": [...],
      "published_at": "2026-02-25T10:00:00Z"
    }
  ],
  "draft": {
    "id": "draft-uuid",
    "form_id": "form-id",
    "status": "editing",
    "fields": [...]
  },
  "_count": {
    "qr_codes": 5,
    "submissions": 42
  }
}
```

---

### PUT /api/forms/[id]
อัพเดทแบบสอบถาม (ถ้าส่งไม่ส่งค่า = ลบค่า)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "fields": [...],
  "theme": "minimal",
  "banner_color": "black",
  "accent_color": "rose"
}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "FORM001",
  ...
}
```

---

### PATCH /api/forms/[id]
อัพเดทแบบสอบถามแบบ partial (ค่าที่ไม่ส่ง = ไม่เปลี่ยน)

**Request Body:**
```json
{
  "title": "Updated Title"
}
```

**Response:**
```json
{
  "id": "uuid",
  ...
}
```

---

### DELETE /api/forms/[id]
ลบแบบสอบถาม

**Response:**
```json
{
  "success": true
}
```

**Error Cases:**
- `404` - Not found

---

## 2. Form Versions API

### GET /api/form-versions
ดึง versions ของ form โดยต้องส่ง formId

**Query Parameters:**
- `formId` (required) - Form ID

**Response:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "version-uuid",
        "form_id": "form-id",
        "version": 2,
        "status": "published",
        "fields": [...],
        "change_summary": "Added email field",
        "published_at": "2026-02-25T10:00:00Z",
        "created_at": "2026-02-25T10:00:00Z",
        "is_draft": false
      }
    ],
    "current_version": 2,
    "form_status": "published"
  }
}
```

---

### POST /api/form-versions
สร้าง version ใหม่ (draft หรือ published)

**Request Body (สร้าง Draft):**
```json
{
  "formId": "form-id",
  "isDraft": true,
  "version": 2,
  "fields": [...],
  "title": "Updated title",
  "description": "...",
  "theme": "card-groups",
  "banner_color": "blue",
  "accent_color": "sky",
  "change_summary": "Added new fields"
}
```

**Response (สร้าง Draft):**
```json
{
  "success": true,
  "data": {
    "id": "version-uuid",
    "form_id": "form-id",
    "version": 2,
    "status": "draft",
    "fields": [...],
    "published_at": null,
    "created_at": "2026-02-25T10:00:00Z"
  }
}
```

**Request Body (สร้าง Published):**
```json
{
  "formId": "form-id",
  "isDraft": false,
  "fields": [...],
  "title": "Updated title",
  "change_summary": "Publish new version"
}
```

**Response (สร้าง Published):**
```json
{
  "success": true,
  "data": {
    "id": "version-uuid",
    "form_id": "form-id",
    "version": 3,
    "status": "published",
    "fields": [...],
    "published_at": "2026-02-25T10:00:00Z"
  }
}
```

**Error Cases:**
- `400` - formId is required
- `409` - Draft already exists (for isDraft: true)

---

### POST /api/form-versions/publish
Publish draft version ให้กลายเป็น published

**Request Body:**
```json
{
  "versionId": "version-uuid",
  "changeSummary": "Updated customer feedback form"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "version": 2,
    "message": "Draft published successfully"
  }
}
```

**Error Cases:**
- `400` - versionId is required
- `404` - Draft not found
- `400` - This version is not a draft

---

## 3. Form Publication API

### POST /api/forms/[id]/publish
Publish แบบสอบถามครั้งแรก (สร้าง version 1)

**Request Body:**
```json
{
  "changeSummary": "Publish initial version"
}
```

**Response:**
```json
{
  "version": 1
}
```

---

### POST /api/forms/[id]/new-version
สร้าง version ใหม่หลังจาก published แล้ว

**Request Body:**
```json
{
  "changeSummary": "Added new fields"
}
```

**Response:**
```json
{
  "version": 2
}
```

---

## 4. Submissions API

### GET /api/submissions
ดึง submissions (admin view) พร้อม pagination, date filter

**Query Parameters:**
- `formId` - Filter by form ID
- `page` (default: 1) - Page number
- `limit` (default: 50, max: 500) - Items per page
- `dateFrom` - Filter submissions from this date (ISO format)
- `dateTo` - Filter submissions to this date (ISO format)

**Response:**
```json
{
  "data": [
    {
      "id": "submission-uuid",
      "form_id": "form-id",
      "form_version": 1,
      "qr_code_id": "qr-uuid",
      "project_id": "project-uuid",
      "responses": {
        "email": "user@example.com",
        "name": "John Doe"
      },
      "utm_source": "facebook",
      "utm_medium": "social",
      "utm_campaign": "campaign1",
      "consent_given": true,
      "consent_ip": "192.168.1.1",
      "consented_at": "2026-02-25T10:00:00Z",
      "submitted_at": "2026-02-25T10:00:00Z",
      "qr_code": {
        "id": "qr-uuid",
        "name": "QR-001",
        "qr_slug": "qr-001"
      },
      "project": {
        "id": "project-uuid",
        "code": "PROJ001",
        "name": "Project Name"
      }
    }
  ],
  "total": 42
}
```

---

### POST /api/forms/[id]/submissions
สร้าง submission ใหม่ (ตอบแบบสอบถาม)

**Path Parameters:**
- `id` - Form ID, slug, หรือ code

**Request Body:**
```json
{
  "responses": {
    "email": "user@example.com",
    "name": "John Doe",
    "feedback": "Great service!"
  },
  "qr_code_id": "qr-uuid",
  "project_id": "project-uuid",
  "utm_source": "facebook",
  "utm_medium": "social",
  "utm_campaign": "campaign1",
  "utm_content": "content",
  "utm_term": "keyword",
  "fingerprint": "device-fingerprint",
  "metadata": {
    "custom_field": "value"
  },
  "consent_given": true,
  "consent_ip": "192.168.1.1",
  "consent_location": {
    "latitude": 13.7563,
    "longitude": 100.5018
  }
}
```

**Response (201):**
```json
{
  "id": "submission-uuid",
  "form_id": "form-id",
  "form_version": 1,
  "responses": {
    "email": "user@example.com",
    "name": "John Doe"
  },
  "submitted_at": "2026-02-25T10:00:00Z"
}
```

**Error Cases:**
- `404` - Form not found or inactive

---

### GET /api/forms/[id]/submissions
ดึง submissions ของ form โดยตรง (พร้อม pagination, filter)

**Path Parameters:**
- `id` - Form ID, slug, หรือ code

**Query Parameters:**
- `limit` (default: 50, max: 100) - Items per page
- `offset` (default: 0) - Skip N items
- `date_from` - Filter from date (ISO format)
- `date_to` - Filter to date (ISO format)
- `qr_code_id` - Filter by QR Code ID
- `project_id` - Filter by Project ID

**Response:**
```json
{
  "form": {
    "id": "form-id",
    "code": "FORM001",
    "title": "Customer Feedback",
    "fields": [...],
    "current_version": 1
  },
  "submissions": [
    {
      "id": "submission-uuid",
      "form_id": "form-id",
      "form_version": 1,
      "responses": {
        "email": "user@example.com"
      },
      "submitted_at": "2026-02-25T10:00:00Z",
      "qr_code": {
        "name": "QR-001",
        "qr_slug": "qr-001"
      }
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## 5. QR Codes API

### GET /api/qr-codes
ดึงรายการ QR Codes (สามารถกรองตาม formId)

**Query Parameters:**
- `formId` - Filter by form ID (optional)

**Response:**
```json
[
  {
    "id": "qr-uuid",
    "form_id": "form-id",
    "project_id": "project-uuid",
    "name": "QR-001",
    "qr_slug": "qr-001",
    "redirect_url": "https://example.com/qr/qr-001",
    "scan_count": 42,
    "last_scanned_at": "2026-02-25T10:00:00Z",
    "utm_source": "facebook",
    "utm_medium": "social",
    "utm_campaign": "campaign1",
    "created_at": "2026-02-25T10:00:00Z",
    "updated_at": "2026-02-25T10:00:00Z",
    "project": {
      "id": "project-uuid",
      "code": "PROJ001",
      "name": "Project Name"
    }
  }
]
```

---

### POST /api/qr-codes
สร้าง QR Code ใหม่

**Request Body:**
```json
{
  "form_id": "form-id",
  "name": "QR-001",
  "qr_slug": "qr-001",
  "project_id": "project-uuid",
  "utm_source": "facebook",
  "utm_medium": "social",
  "utm_campaign": "campaign1",
  "utm_content": "content",
  "utm_term": "keyword"
}
```

**Response (201):**
```json
{
  "id": "qr-uuid",
  "form_id": "form-id",
  "name": "QR-001",
  "qr_slug": "qr-001",
  "scan_count": 0,
  "created_at": "2026-02-25T10:00:00Z"
}
```

**Error Cases:**
- `400` - form_id, name, qr_slug are required
- `409` - QR slug already exists

---

### GET /api/qr-codes/[id]
ดึง QR Code ตาม ID

**Response:**
```json
{
  "id": "qr-uuid",
  "form_id": "form-id",
  "name": "QR-001",
  "qr_slug": "qr-001",
  "scan_count": 42,
  ...
}
```

---

### PUT /api/qr-codes/[id]
อัพเดท QR Code

**Request Body:**
```json
{
  "name": "Updated Name",
  "utm_source": "instagram"
}
```

**Response:**
```json
{
  "id": "qr-uuid",
  ...
}
```

---

### DELETE /api/qr-codes/[id]
ลบ QR Code

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/qr-codes/[id]/scan
บันทึก QR Code scan (อัพเดท scan count และ last_scanned_at)

**Response:**
```json
{
  "id": "qr-uuid",
  "scan_count": 43,
  "last_scanned_at": "2026-02-25T10:00:00Z"
}
```

---

## 6. CSS Integration API

### PATCH /api/forms/[id]/css-integration
อัพเดทการตั้งค่า CSS Integration ของแบบสอบถาม

**Request Body:**
```json
{
  "css_integration_enabled": true,
  "css_field_mapping": {
    "jobDetail": "field-id-1",
    "customerName": "field-id-2",
    "telephone": "field-id-3",
    "email": "field-id-4"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "css_integration_enabled": true,
    "css_field_mapping": {
      "jobDetail": "field-id-1",
      "customerName": "field-id-2",
      "telephone": "field-id-3",
      "email": "field-id-4"
    }
  }
}
```

**Error Cases:**
- `500` - Database error

---

## 7. Theme API

### PATCH /api/forms/[id]/theme
อัพเดทเทม settings

**Request Body:**
```json
{
  "theme": "card-groups",
  "banner_color": "blue",
  "banner_custom_color": "#3b82f6",
  "banner_mode": "gradient",
  "accent_color": "sky",
  "accent_custom_color": "#0ea5e9",
  "logo_url": "https://example.com/logo.png",
  "logo_position": "left",
  "logo_size": "medium"
}
```

**Response:**
```json
{
  "id": "form-id",
  "theme": "card-groups",
  "banner_color": "blue",
  ...
}
```

---

## 8. Other APIs

### POST /api/forms/[id]/toggle-active
Toggle form active status

**Request Body:**
```json
{
  "is_active": true
}
```

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/forms/[id]/duplicate
Duplicate form with all its settings

**Request Body:**
```json
{
  "newTitle": "Copy of Original Form",
  "newCode": "FORM-COPY",
  "newSlug": "form-copy"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-form-id",
    "code": "FORM-COPY",
    "slug": "form-copy",
    ...
  }
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Required field is missing"
}
```

### 404 Not Found
```json
{
  "error": "Not found"
}
```

### 409 Conflict
```json
{
  "error": "Resource already exists"
}
```

### 500 Server Error
```json
{
  "error": "Error message"
}
```

---

## Notes for Frontend Integration

### Response Format Variations
- **Array responses**: GET endpoints often return direct arrays
- **Object with data property**: POST/PATCH endpoints usually return `{ data: {...} }`
- **Success wrapper**: Some endpoints return `{ success: true, data: {...} }`
- **Admin endpoints**: /api/submissions returns `{ data: [...], total: N }`

### Handling Multiple Response Formats (useSubmissions Hook Pattern)
```typescript
const response = await fetch(url);
const data = await response.json();
// Handle both formats
const submissions = Array.isArray(data) ? data : (data.data || data.submissions || []);
```

### Consent Fields
- `consent_given` - Whether user gave consent
- `consent_ip` - IP address when consent was given
- `consent_location` - Geographic location data (JSON)
- `consented_at` - Timestamp of consent

### Version Management
- `current_version` - Published version number
- `draft_version` - Draft version number (null if no draft)
- Form can only have ONE draft at a time
- Publishing a draft updates form fields and theme

### CSS Integration
- Only shows fields from published form (not draft fields)
- Maps form fields to external CSS element IDs
- `css_field_mapping` is a JSON object with field mappings
