# Questionnaire QR System - API Documentation

## การตั้งค่า

ต้องเพิ่ม Environment Variable ในไฟล์ `.env.local`:

```bash
# Supabase Service Role Key (จำเป็นสำหรับ API)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

> **หมายเหตุ:** Service Role Key สามารถหาได้จาก Supabase Dashboard → Project Settings → API → service_role secret

---

## API Endpoints

### 1. List All Forms
```
GET /api/forms
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| status | string | published / draft / archived | - |
| limit | number | จำนวนรายการต่อหน้า | 100 |
| offset | number | เริ่มจากรายการที่ | 0 |

**Example:**
```bash
curl "http://localhost:4001/api/forms?status=published&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "FRM-001",
      "title": "แบบสอบถามความพึงพอใจ",
      "slug": "satisfaction-survey",
      "status": "published",
      "current_version": 2,
      "is_active": true,
      "created_at": "2024-01-15T08:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "limit": 10,
    "offset": 0
  }
}
```

---

### 2. Get Form Details
```
GET /api/forms/{id}
```

รองรับการค้นหาด้วย:
- `id`: UUID (e.g., `45bff21f-686f-43ac-8ab3-02bc42a3303e`)
- `code`: Form code (e.g., `FRM-001`)
- `slug`: Form slug (e.g., `satisfaction-survey`)

**Example:**
```bash
# โดย ID
curl "http://localhost:4001/api/forms/45bff21f-686f-43ac-8ab3-02bc42a3303e"

# โดย Code
curl "http://localhost:4001/api/forms/FRM-001"

# โดย Slug
curl "http://localhost:4001/api/forms/satisfaction-survey"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "FRM-001",
    "title": "แบบสอบถามความพึงพอใจ",
    "slug": "satisfaction-survey",
    "description": "...",
    "status": "published",
    "current_version": 2,
    "is_active": true,
    "fields": [...]
  }
}
```

---

### 3. Get Submissions (คำตอบ)
```
GET /api/forms/{id}/submissions
```

รองรับการค้นหาด้วย `id`, `code`, หรือ `slug` เหมือน endpoint ข้างต้น

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| limit | number | จำนวนรายการต่อหน้า (max 100) | 50 |
| offset | number | เริ่มจากรายการที่ | 0 |
| date_from | string | วันเริ่มต้น (YYYY-MM-DD) | - |
| date_to | string | วันสิ้นสุด (YYYY-MM-DD) | - |
| qr_code_id | string | กรองตาม QR Code ID | - |
| project_id | string | กรองตาม Project ID | - |

**Example:**
```bash
# ดึงคำตอบทั้งหมด
curl "http://localhost:4001/api/forms/FRM-001/submissions"

# ดึง 20 คำตอบล่าสุด
curl "http://localhost:4001/api/forms/FRM-001/submissions?limit=20"

# ดึงคำตอบช่วงวันที่
curl "http://localhost:4001/api/forms/FRM-001/submissions?date_from=2024-01-01&date_to=2024-01-31"

# ดึงคำตอบจาก QR Code ที่ระบุ
curl "http://localhost:4001/api/forms/FRM-001/submissions?qr_code_id=uuid"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "form": {
      "id": "uuid",
      "code": "FRM-001",
      "title": "แบบสอบถามความพึงพอใจ",
      "current_version": 2,
      "fields": [
        { "key": "field_1", "label": "คำถามที่ 1", "type": "text" },
        { "key": "field_2", "label": "คำถามที่ 2", "type": "choice" }
      ]
    },
    "submissions": [
      {
        "id": "uuid",
        "submitted_at": "2024-01-15T10:30:00Z",
        "form_version": 2,
        "responses": {
          "field_1": "คำตอบข้อที่ 1",
          "field_2": "ตัวเลือก A"
        },
        "utm": {
          "source": "QR Code",
          "medium": "K9",
          "campaign": "FRM-001",
          "content": "frm-001-k9-xxx",
          "term": null
        },
        "qr_code": {
          "id": "uuid",
          "name": "FRM-001-K9"
        },
        "project": {
          "id": "uuid",
          "code": "K9",
          "name": "เสนาพาร์ค แกรนด์รามอินทรา"
        }
      }
    ]
  },
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Error Responses

```json
// 404 - Form not found
{
  "success": false,
  "error": "Form not found"
}

// 500 - Server error
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Pagination

ใช้ `limit` และ `offset` สำหรับการแบ่งหน้า:

```bash
# หน้าแรก (รายการ 1-50)
curl "/api/forms/FRM-001/submissions?limit=50&offset=0"

# หน้าที่สอง (รายการ 51-100)
curl "/api/forms/FRM-001/submissions?limit=50&offset=50"

# หน้าที่สาม (รายการ 101-150)
curl "/api/forms/FRM-001/submissions?limit=50&offset=100"
```

---

## ตัวอย่างการใช้งานกับ JavaScript

```javascript
// ดึงรายการฟอร์มทั้งหมด
const getForms = async () => {
  const res = await fetch('http://localhost:4001/api/forms');
  const data = await res.json();
  return data.data;
};

// ดึงคำตอบของฟอร์ม
const getSubmissions = async (formCode) => {
  const res = await fetch(`http://localhost:4001/api/forms/${formCode}/submissions?limit=100`);
  const data = await res.json();
  return data.data;
};

// ใช้งาน
const submissions = await getSubmissions('FRM-001');
console.log(submissions.form.title); // ชื่อฟอร์ม
console.log(submissions.submissions); // คำตอบทั้งหมด
```

---

## หมายเหตุด้านความปลอดภัย

1. **Service Role Key** มีสิทธิ์เต็มใน database ควรเก็บเป็นความลับ
2. ควรเพิ่ม **API Key** หรือ **Authentication** ถ้าต้องการจำกัดการเข้าถึง
3. สามารถเพิ่ม **CORS** จำกัด domain ที่เรียกใช้ได้
