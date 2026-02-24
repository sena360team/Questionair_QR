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
  'choice' | 'multiple_choice' | 'dropdown' | 'rating' | 'date' |
  'time' | 'scale' | 'nps';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];       // สำหรับ choice, multiple_choice, dropdown
  allow_other?: boolean;    // ให้เลือก "อื่นๆ" และพิมพ์เองได้ (สำหรับ choice, dropdown)
  searchable?: boolean;     // ให้ค้นหาได้ (สำหรับ dropdown เมื่อ options เยอะ)
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
  // Theme
  theme?: 'default' | 'card-groups' | 'step-wizard' | 'minimal';
  // Logo settings
  logo_position?: 'center' | 'left' | 'right';
  logo_size?: 'small' | 'medium' | 'large';
  // Color Theme Settings
  banner_color?: 'blue' | 'black' | 'white' | 'custom';
  banner_custom_color?: string;
  banner_mode?: 'gradient' | 'solid';
  accent_color?: 'blue' | 'sky' | 'teal' | 'emerald' | 'violet' | 'rose' | 'orange' | 'slate' | 'black' | 'custom';
  accent_custom_color?: string;
  // Consent settings
  require_consent?: boolean;
  consent_heading?: string;  // หัวข้อ Consent (e.g., "การยินยอม", "ข้อตกลง")
  consent_text?: string;
  consent_require_location?: boolean;
  // CSS Integration (Config is in global app_settings)
  css_integration_enabled?: boolean;
  css_field_mapping?: {
    jobDetail: string;
    customerName: string;
    telephone: string;
    email: string;
  };
  // Clone tracking
  cloned_from?: string | null;
  cloned_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Computed fields
  has_draft?: boolean;
  draft_version?: number | null;
  draft_status?: 'editing' | 'pending_review' | 'approved' | 'rejected' | null;
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
  // Theme
  theme?: 'default' | 'card-groups' | 'step-wizard' | 'minimal';
  // Color Theme Settings
  banner_color?: 'blue' | 'black' | 'white' | 'custom';
  banner_custom_color?: string;
  banner_mode?: 'gradient' | 'solid';
  accent_color?: 'blue' | 'sky' | 'teal' | 'emerald' | 'violet' | 'rose' | 'orange' | 'slate' | 'black' | 'custom';
  accent_custom_color?: string;
  // Consent settings
  require_consent?: boolean;
  consent_heading?: string;
  consent_text?: string;
  consent_require_location?: boolean;
}

// ============================================================
// Form Version Types (Enhanced)
// ============================================================

export interface FormVersion {
  id: string;
  form_id: string;
  version: number;
  status: 'published' | 'draft' | 'archived';
  fields: FormField[];
  fields_hash: string;
  // Enhanced metadata
  title?: string;
  description?: string | null;
  logo_url?: string | null;
  theme?: string;
  banner_color?: string;
  banner_custom_color?: string | null;
  banner_mode?: string;
  accent_color?: string;
  accent_custom_color?: string | null;
  logo_position?: string;
  logo_size?: string;
  require_consent?: boolean;
  consent_heading?: string;
  consent_text?: string | null;
  consent_require_location?: boolean;
  change_summary?: string;
  created_at: string;
  created_by?: string | null;
  published_at?: string | null;
  published_by?: string | null;
  // Revert tracking
  is_reverted?: boolean;
  reverted_to_version?: number | null;
  created_from_clone?: string | null;
  // Join data
  created_by_user?: {
    id: string;
    email?: string;
  } | null;
  published_by_user?: {
    id: string;
    email?: string;
  } | null;
}

export interface FormVersionWithUser extends FormVersion {
  published_by_name?: string;
}

export interface FormWithVersion extends Form {
  versions?: FormVersion[];
  total_submissions?: number;
}

// ============================================================
// Form Draft Types (NEW)
// ============================================================

export type DraftStatus = 'editing' | 'pending_review' | 'approved' | 'rejected';

export interface FormDraft {
  id: string;
  form_id: string;
  // Content
  title: string;
  description?: string | null;
  logo_url?: string | null;
  fields: FormField[];
  // Theme
  theme?: 'default' | 'card-groups' | 'step-wizard' | 'minimal';
  // Color Theme Settings
  banner_color?: 'blue' | 'black' | 'white' | 'custom';
  banner_custom_color?: string;
  banner_mode?: 'gradient' | 'solid';
  accent_color?: 'blue' | 'sky' | 'teal' | 'emerald' | 'violet' | 'rose' | 'orange' | 'slate' | 'black' | 'custom';
  accent_custom_color?: string;
  // Logo Settings
  logo_position?: 'left' | 'center' | 'right';
  logo_size?: 'small' | 'medium' | 'large';
  // Consent Settings
  require_consent: boolean;
  consent_heading: string;
  consent_text?: string | null;
  consent_require_location: boolean;
  // Workflow Status
  status: DraftStatus;
  // Revert Info
  is_revert?: boolean;
  revert_from_version?: number | null;
  revert_to_version?: number | null;
  revert_notes?: string | null;
  // Submission for Review
  submitted_by?: string | null;
  submitted_at?: string | null;
  submitted_notes?: string | null;
  // Review Info
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  // Metadata
  created_at: string;
  updated_at: string;
  // Join data
  submitted_by_user?: {
    id: string;
    email?: string;
  } | null;
  reviewed_by_user?: {
    id: string;
    email?: string;
  } | null;
}

export interface FormDraftCreateInput {
  form_id: string;
  title?: string;
  description?: string;
  logo_url?: string;
  theme?: 'default' | 'card-groups' | 'step-wizard' | 'minimal';
  // Color Theme Settings
  banner_color?: 'blue' | 'black' | 'white' | 'custom';
  banner_custom_color?: string;
  banner_mode?: 'gradient' | 'solid';
  accent_color?: 'blue' | 'sky' | 'teal' | 'emerald' | 'violet' | 'rose' | 'orange' | 'slate' | 'black' | 'custom';
  accent_custom_color?: string;
  logo_position?: 'left' | 'center' | 'right';
  logo_size?: 'small' | 'medium' | 'large';
  fields?: FormField[];
  require_consent?: boolean;
  consent_heading?: string;
  consent_text?: string;
  consent_require_location?: boolean;
}

// ============================================================
// Duplicate/Clone Types (NEW)
// ============================================================

export interface DuplicateFormOptions {
  copy_questions: boolean;
  copy_settings: boolean;
  copy_logo: boolean;
}

export interface DuplicateFormRequest {
  title: string;
  options: DuplicateFormOptions;
}

export interface DuplicateFormResponse {
  new_form_id: string;
  code: string;
  message: string;
}

// ============================================================
// Revert Types (NEW)
// ============================================================

export interface RevertFormRequest {
  to_version: number;
  notes?: string;
}

export interface RevertFormResponse {
  draft_id: string;
  message: string;
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

  // Return Types
  form_version?: number; // DB level addition 
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
