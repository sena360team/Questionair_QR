// ============================================================
// Type Definitions for Questionnaire QR System
// ============================================================

// ============================================================
// Project Types (NEW)
// ============================================================

export interface Project {
  id: string;
  code: string;        // รหัสโครงการ (e.g., "PRJ-2024-001")
  name: string;        // ชื่อโปรเจค (e.g., "โครงการสำรวจความพึงพอใจลูกค้า 2024")
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateInput {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

// ============================================================
// Form Types
// ============================================================

export type FieldType = 'heading' | 'section' | 'info_box' | 'text' | 'textarea' | 'email' | 'number' | 'tel' | 
                        'choice' | 'multiple_choice' | 'rating' | 'date' | 
                        'time' | 'scale' | 'nps';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];       // สำหรับ choice, multiple_choice
  allow_other?: boolean;    // ให้เลือก "อื่นๆ" และพิมพ์เองได้
  min?: number;             // สำหรับ rating, scale, number
  max?: number;             // สำหรับ rating, scale, number
  helpText?: string;        // คำอธิบายเพิ่มเติม
  _versionAdded?: number;   // UI only: Version ที่เพิ่มคำถามนี้ (ใช้แสดงสี)
}

export interface Form {
  id: string;
  code: string;        // รหัสแบบสอบถาม (e.g., FRM-001)
  slug: string;
  title: string;
  description: string | null;
  logo_url?: string | null;  // Logo URL สำหรับแสดงในหัวฟอร์ม
  fields: FormField[];
  is_active: boolean;
  allow_multiple_responses: boolean;
  // Status & Version
  status?: 'draft' | 'published' | 'archived';
  current_version?: number;
  fields_hash?: string;
  published_at?: string;
  published_by?: string | null;
  // Consent settings
  require_consent?: boolean;
  consent_heading?: string;  // หัวข้อ Consent (e.g., "การยินยอม", "ข้อตกลง")
  consent_text?: string;
  consent_require_location?: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FormCreateInput {
  code: string;      // รหัสแบบสอบถาม
  slug: string;
  title: string;
  description?: string;
  logo_url?: string;
  fields: FormField[];
  is_active?: boolean;
  allow_multiple_responses?: boolean;
  // Status & Version
  status?: 'draft' | 'published' | 'archived';
  // Consent settings
  require_consent?: boolean;
  consent_heading?: string;
  consent_text?: string;
  consent_require_location?: boolean;
}

// ============================================================
// Form Version Types
// ============================================================

export interface FormVersion {
  id: string;
  form_id: string;
  version: number;
  fields: FormField[];
  fields_hash: string;
  change_summary?: string;
  published_at: string;
  published_by?: string | null;
}

export interface FormWithVersion extends Form {
  versions?: FormVersion[];
  total_submissions?: number;
}

// ============================================================
// QR Code Types
// ============================================================

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface QRCode {
  id: string;
  form_id: string;
  project_id?: string | null;  // NEW: เชื่อมโยงกับโครงการ
  name: string;
  qr_slug: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  redirect_url: string | null;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  
  // Join data
  form?: Form;
  project?: Project;  // NEW
}

export interface QRCodeCreateInput {
  form_id: string;
  project_id?: string | null;  // NEW
  name: string;
  qr_slug: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

// ============================================================
// Submission Types
// ============================================================

export interface Submission {
  id: string;
  form_id: string;
  qr_code_id: string | null;
  project_id?: string | null;  // NEW
  responses: Record<string, unknown>;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  fingerprint: string | null;
  submitted_at: string;
  metadata: Record<string, unknown> | null;
  
  // Consent Stamp
  consent_given?: boolean;
  consent_ip?: string | null;
  consent_location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  } | null;
  consented_at?: string | null;
  
  // Join data
  form?: Form;
  qr_code?: QRCode;
  project?: Project;  // NEW
}

export interface SubmissionCreateInput {
  form_id: string;
  qr_code_id?: string | null;
  project_id?: string | null;  // NEW
  responses: Record<string, unknown>;
  utm_params?: UTMParams;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Analytics Types
// ============================================================

export interface UTMSummary {
  form_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  submission_count: number;
  first_submission: string;
  last_submission: string;
}

export interface QRPerformance {
  id: string;
  name: string;
  qr_slug: string;
  form_id: string;
  form_title: string;
  default_utm_source: string | null;
  default_utm_medium: string | null;
  default_utm_campaign: string | null;
  default_utm_content: string | null;
  scan_count: number;
  last_scanned_at: string | null;
  actual_submissions: number;
  created_at: string;
}

export interface AnalyticsDashboard {
  total_forms: number;
  total_qr_codes: number;
  total_submissions: number;
  submissions_today: number;
  submissions_this_week: number;
  submissions_this_month: number;
  top_utm_sources: { source: string; count: number }[];
  top_qr_codes: { id: string; name: string; count: number }[];
  submissions_by_date: { date: string; count: number }[];
}

// NEW: Project Analytics
export interface ProjectAnalytics {
  project_id: string;
  project_name: string;
  project_code: string;
  total_qr_codes: number;
  total_scans: number;
  total_submissions: number;
  conversion_rate: number;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface QRRedirectData {
  target_url: string;
  form_id: string;
  qr_code_id: string;
  utm_params: UTMParams;
}

// NEW: Excel Import Types
export interface ExcelImportResult {
  success: boolean;
  imported: number;
  errors: { row: number; error: string }[];
  data?: Project[];
}
