# CSS Integration Guide (Complaint Service System)

ระบบการเชื่อมต่อ API กับ CSS (Complaint Service System) - โครงสร้างข้อมูลและวิธีการใช้งาน

---

## 📋 Overview

CSS Integration มี **2 ส่วนหลัก**:
1. **CSS API Configuration** - ตั้งค่ากลางในระบบ (Admin Settings)
2. **CSS Field Mapping** - ตั้งค่าการแมพ field ของแต่ละแบบสอบถาม

---

## Part 1: CSS API Configuration (Global System Settings)

### API Endpoint
- **GET**: `/api/admin/settings/css`
- **PUT**: `/api/admin/settings/css`

### Purpose
บันทึก credentials และ configuration สำหรับการเชื่อมต่อกับ CSS API ระบบกลาง

### GET /api/admin/settings/css
ดึงการตั้งค่า CSS API ที่บันทึกไว้

**Response:**
```json
{
  "apiKey": "your-css-api-key-here",
  "contactChannelId": "channel-123",
  "userCreated": "user-id-456"
}
```

---

### PUT /api/admin/settings/css
บันทึกหรืออัพเดทการตั้งค่า CSS API

**Request Body:**
```json
{
  "apiKey": "your-css-api-key-here",
  "contactChannelId": "channel-123",
  "userCreated": "user-id-456"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `apiKey` | string | API Key สำหรับเชื่อมต่อกับระบบ CSS | `sk_live_abc123def456...` |
| `contactChannelId` | string | รหัสช่องทางการติดต่อในระบบ CSS | `channel-support-001` |
| `userCreated` | string | รหัสผู้ใช้ที่สร้างรายการในระบบ CSS | `admin-001` |

---

## Part 2: CSS Field Mapping (Per Form)

### API Endpoint
- **PATCH**: `/api/forms/[id]/css-integration`

### Purpose
แมพ form fields เพื่อส่งไปยัง CSS API เมื่อ submit form

### PATCH /api/forms/[id]/css-integration
อัพเดทการตั้งค่า CSS Integration ของแบบสอบถาม

**Path Parameters:**
- `id` - Form ID

**Request Body:**
```json
{
  "css_integration_enabled": true,
  "css_field_mapping": {
    "jobDetail": "field-uuid-1",
    "customerName": "field-uuid-2",
    "telephone": "field-uuid-3",
    "email": "field-uuid-4"
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
      "jobDetail": "field-uuid-1",
      "customerName": "field-uuid-2",
      "telephone": "field-uuid-3",
      "email": "field-uuid-4"
    }
  }
}
```

---

### Field Mapping Details

**Predefined CSS Fields** (must map to form fields):

| CSS Field | Description | Required | Data Type |
|-----------|-------------|----------|-----------|
| `jobDetail` | รายละเอียดงาน/ประเด็น | Yes | text/textarea |
| `customerName` | ชื่อผู้รายงาน | Yes | text |
| `telephone` | เบอร์โทรศัพท์ | Yes | text |
| `email` | อีเมล | Yes | text |

**Mapping Structure:**
```typescript
interface CSSFieldMapping {
  jobDetail: string;      // Form field ID (uuid)
  customerName: string;   // Form field ID (uuid)
  telephone: string;      // Form field ID (uuid)
  email: string;          // Form field ID (uuid)
}
```

---

## ⚙️ How It Works (Flow)

### 1. Admin Setup (One Time)
```
Admin → Settings Page (API TO CSS tab)
  ↓
  Input: API Key, Contact Channel ID, User Created ID
  ↓
  PUT /api/admin/settings/css
  ↓
  Data saved in app_settings table (key='css_api_config')
```

### 2. Form Configuration (Per Form)
```
Admin → Edit Form → Settings Tab
  ↓
  Toggle: Enable CSS Integration
  ↓
  Map form fields to CSS fields:
    - jobDetail → Select from published fields
    - customerName → Select from published fields
    - telephone → Select from published fields
    - email → Select from published fields
  ↓
  Save button → PATCH /api/forms/[id]/css-integration
  ↓
  Data saved in forms table:
    - css_integration_enabled: boolean
    - css_field_mapping: JSON
```

### 3. Form Submission
```
User fills out form
  ↓
  POST /api/forms/[id]/submissions
  ↓
  System checks: css_integration_enabled == true
  ↓
  Extract responses using css_field_mapping:
    {
      "jobDetail": response[mapping.jobDetail],
      "customerName": response[mapping.customerName],
      "telephone": response[mapping.telephone],
      "email": response[mapping.email]
    }
  ↓
  POST to CSS API endpoint:
    https://api-css.senxgroup.com/api/complaint-list/create-by-other
    (using apiKey, contactChannelId, userCreated from settings)
  ↓
  Complaint created in CSS system
```

---

## 🔍 Database Storage

### AppSetting Table (Global Config)
```sql
{
  "key": "css_api_config",
  "value": {
    "apiKey": "sk_live_...",
    "contactChannelId": "channel-123",
    "userCreated": "user-id-456"
  }
}
```

### Form Table (Per Form Config)
```sql
{
  "id": "form-uuid",
  "css_integration_enabled": true,
  "css_field_mapping": {
    "jobDetail": "field-uuid-1",
    "customerName": "field-uuid-2",
    "telephone": "field-uuid-3",
    "email": "field-uuid-4"
  }
}
```

---

## 📝 Frontend State Management (EditFormPage)

### State Variables
```typescript
// CSS Integration Global Settings
const [cssIntegrationEnabled, setCssIntegrationEnabled] = useState(false);

// CSS Field Mapping
const [cssFieldMapping, setCssFieldMapping] = useState({
  jobDetail: '',      // Form field ID
  customerName: '',   // Form field ID
  telephone: '',      // Form field ID
  email: ''           // Form field ID
});
```

### When Creating/Updating Draft
```typescript
const newDraft = await createDraft({
  css_integration_enabled: cssIntegrationEnabled,
  css_field_mapping: cssFieldMapping,
  // ... other fields
});
```

### When Saving Published Form
```typescript
const response = await fetch(`/api/forms/${formId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    css_integration_enabled: cssIntegrationEnabled,
    css_field_mapping: cssFieldMapping,
    // ... other fields
  }),
});
```

---

## 🛡️ Important Notes

### Field Selection Rules
1. ✅ Only **published form fields** appear in dropdowns
2. ❌ Draft fields are NOT shown in CSS Integration mapping
3. ✅ Only `text` and `textarea` field types are selectable
4. ✅ All 4 CSS fields (`jobDetail`, `customerName`, `telephone`, `email`) are required

### Validation
- Form must be **active** to submit
- If `css_integration_enabled = true`, all 4 CSS fields must be mapped
- CSS API credentials must be configured in Settings before integration works

### Data Flow
1. User submits form with responses
2. System checks if form has CSS integration enabled
3. If enabled, extracts mapped field values from responses
4. Sends data to CSS API endpoint with authentication

---

## 📊 Example: Complete Flow

### Step 1: Configure CSS API (Admin)
```json
PUT /api/admin/settings/css

{
  "apiKey": "sk_live_abc123",
  "contactChannelId": "ch_support",
  "userCreated": "admin_001"
}
```

### Step 2: Create Form with Fields
```json
POST /api/forms

{
  "code": "COMPLAINT_FORM",
  "slug": "complaint-form",
  "title": "Customer Complaint Form",
  "fields": [
    {
      "id": "field-1",
      "name": "issue_description",
      "label": "Issue Description",
      "type": "textarea"
    },
    {
      "id": "field-2",
      "name": "customer_name",
      "label": "Your Name",
      "type": "text"
    },
    {
      "id": "field-3",
      "name": "phone_number",
      "label": "Phone Number",
      "type": "text"
    },
    {
      "id": "field-4",
      "name": "email_address",
      "label": "Email",
      "type": "text"
    }
  ]
}
```

### Step 3: Publish Form
```json
POST /api/forms/{form-id}/publish

{
  "changeSummary": "Initial publish"
}
```

### Step 4: Configure CSS Integration
```json
PATCH /api/forms/{form-id}/css-integration

{
  "css_integration_enabled": true,
  "css_field_mapping": {
    "jobDetail": "field-1",
    "customerName": "field-2",
    "telephone": "field-3",
    "email": "field-4"
  }
}
```

### Step 5: User Submits Form
```json
POST /api/forms/{form-id}/submissions

{
  "responses": {
    "field-1": "The service was very slow",
    "field-2": "John Doe",
    "field-3": "0812345678",
    "field-4": "john@example.com"
  }
}
```

### Step 6: System Sends to CSS API
```
System extracts from responses using css_field_mapping:
{
  "jobDetail": "The service was very slow",
  "customerName": "John Doe",
  "telephone": "0812345678",
  "email": "john@example.com"
}

POST https://api-css.senxgroup.com/api/complaint-list/create-by-other
Headers: Authorization: Bearer sk_live_abc123
Body:
{
  "contactChannelId": "ch_support",
  "userCreated": "admin_001",
  "jobDetail": "The service was very slow",
  "customerName": "John Doe",
  "telephone": "0812345678",
  "email": "john@example.com"
}
```

---

## 🐛 Troubleshooting

### Issue: CSS Field Mapping dropdown is empty
**Solution:** Ensure form has been published first. CSS Integration only shows published fields, not draft fields.

### Issue: CSS Integration settings reset on page refresh
**Solution:** Make sure you click "Save" button. The PATCH request must complete successfully before refreshing.

### Issue: Submissions not being sent to CSS API
**Checklist:**
1. ✅ Is CSS API credentials configured? (Settings → API TO CSS)
2. ✅ Is form's `css_integration_enabled = true`?
3. ✅ Are all 4 CSS fields mapped?
4. ✅ Is form published (not in draft)?
5. ✅ Is form active (`is_active = true`)?

### Issue: "The column forms.css_integration_enabled does not exist"
**Solution:** Run database migration to add CSS Integration columns:
```sql
ALTER TABLE forms ADD COLUMN css_integration_enabled BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN css_field_mapping JSONB;
```

---

## 📚 Related Documentation
- See [API_REFERENCE.md](./API_REFERENCE.md) for complete API endpoint documentation
- See [Prisma Schema](./prisma/schema.prisma) for database structure
