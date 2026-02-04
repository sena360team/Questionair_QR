// ============================================================
// Supabase Client Configuration
// ============================================================

import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// ============================================================
// Client Configuration
// ============================================================

// ใช้สำหรับ Client Components
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
};

// ใช้สำหรับ Server Components / API Routes
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey);
};

// Singleton instance สำหรับ client-side
let browserClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseBrowser = () => {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowser ใช้ได้เฉพาะ client-side');
  }
  
  if (!browserClient) {
    browserClient = createClient();
  }
  
  return browserClient;
};

// ============================================================
// Projects API
// ============================================================

/**
 * ดึงรายการโครงการทั้งหมด
 */
export async function getAllProjects() {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

/**
 * สร้างโครงการใหม่
 */
export async function createProject(project: {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * อัพเดทโครงการ
 */
export async function updateProject(id: string, updates: Partial<{
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}>) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * ลบโครงการ
 */
export async function deleteProject(id: string) {
  const supabase = getSupabaseBrowser();
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// ============================================================
// Forms API
// ============================================================

/**
 * ดึงฟอร์มตาม slug
 */
export async function getFormBySlug(slug: string) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * ดึงรายการฟอร์มทั้งหมด
 */
export async function getAllForms() {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('forms')
    .select(`
      *,
      qr_codes:qr_codes(count),
      submissions:submissions(count)
    `)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

/**
 * สร้างฟอร์มใหม่
 */
export async function createForm(form: {
  code: string;
  slug: string;
  title: string;
  description?: string;
  fields: unknown[];
  is_active?: boolean;
  allow_multiple_responses?: boolean;
}) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('forms')
    .insert(form)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * อัพเดทฟอร์ม
 */
export async function updateForm(id: string, updates: Partial<{
  code: string;
  slug: string;
  title: string;
  description: string;
  fields: unknown[];
  is_active: boolean;
  allow_multiple_responses: boolean;
}>) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('forms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * ลบฟอร์ม
 */
export async function deleteForm(id: string) {
  const supabase = getSupabaseBrowser();
  
  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// ============================================================
// Form Version API
// ============================================================

/**
 * Publish ฟอร์มครั้งแรก (สร้าง version 1)
 */
export async function publishForm(formId: string, changeSummary?: string) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .rpc('publish_form', {
      p_form_id: formId,
      p_change_summary: changeSummary || 'Publish ครั้งแรก'
    });
    
  if (error) throw error;
  return data as number; // คืน version number
}

/**
 * สร้าง version ใหม่ (หลังจาก publish แล้ว)
 */
export async function createNewVersion(formId: string, changeSummary?: string) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .rpc('create_new_version', {
      p_form_id: formId,
      p_change_summary: changeSummary
    });
    
  if (error) throw error;
  return data as number; // คืน version number
}

/**
 * ดึงประวัติ version ของฟอร์ม
 */
export async function getFormVersions(formId: string) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('form_versions')
    .select('*')
    .eq('form_id', formId)
    .order('version', { ascending: true });
    
  if (error) throw error;
  return data;
}

/**
 * ดึงฟอร์มพร้อมคำถามตรง version นั้น
 */
export async function getFormWithVersion(formId: string, version?: number) {
  const supabase = getSupabaseBrowser();
  
  // ถ้าไม่ระบุ version ให้ใช้ current_version
  if (!version) {
    const { data: form } = await supabase
      .from('forms')
      .select('current_version')
      .eq('id', formId)
      .single();
    version = form?.current_version || 1;
  }
  
  // ดึงข้อมูลฟอร์มพร้อม version นั้น
  const { data, error } = await supabase
    .from('forms')
    .select(`
      *,
      version_data:form_versions!inner(*)
    `)
    .eq('id', formId)
    .eq('form_versions.version', version)
    .single();
    
  if (error) throw error;
  return data;
}

// ============================================================
// QR Codes API
// ============================================================

/**
 * ดึง QR Code ตาม slug พร้อมข้อมูลฟอร์ม
 */
export async function getQRCodeBySlug(qrSlug: string) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('qr_codes')
    .select(`
      *,
      form:forms(*),
      project:projects(*)
    `)
    .eq('qr_slug', qrSlug)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * ดึงรายการ QR Codes ตาม form_id
 */
export async function getQRCodesByForm(formId: string) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('qr_codes')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('form_id', formId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

/**
 * สร้าง QR Code ใหม่
 */
export async function createQRCode(qrCode: {
  form_id: string;
  project_id?: string | null;
  name: string;
  qr_slug: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  redirect_url?: string;
}) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('qr_codes')
    .insert(qrCode)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * อัพเดท QR Code
 */
export async function updateQRCode(id: string, updates: Partial<{
  name: string;
  qr_slug: string;
  redirect_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}>) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('qr_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * ลบ QR Code
 */
export async function deleteQRCode(id: string) {
  const supabase = getSupabaseBrowser();
  
  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

/**
 * บันทึกการสแกน QR Code
 */
export async function recordQRScan(qrSlug: string) {
  const supabase = getSupabaseBrowser();
  
  const { error } = await supabase.rpc('record_qr_scan', {
    qr_slug_param: qrSlug
  });
  
  if (error) throw error;
}

// ============================================================
// Submissions API
// ============================================================

/**
 * สร้าง submission ใหม่
 */
export async function createSubmission(
  formId: string,
  responses: Record<string, unknown>,
  options?: {
    qrCodeId?: string;
    projectId?: string;
    utmParams?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
      utm_term?: string;
    };
    fingerprint?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const supabase = getSupabaseBrowser();
  
  const submission = {
    form_id: formId,
    qr_code_id: options?.qrCodeId || null,
    project_id: options?.projectId || null,
    responses,
    utm_source: options?.utmParams?.utm_source || null,
    utm_medium: options?.utmParams?.utm_medium || null,
    utm_campaign: options?.utmParams?.utm_campaign || null,
    utm_content: options?.utmParams?.utm_content || null,
    utm_term: options?.utmParams?.utm_term || null,
    fingerprint: options?.fingerprint || null,
    metadata: options?.metadata || {}
  };
  
  const { data, error } = await supabase
    .from('submissions')
    .insert(submission)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * ดึง submissions ตาม form_id
 */
export async function getSubmissionsByForm(formId: string) {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      qr_code:qr_codes(name, qr_slug)
    `)
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

// ============================================================
// Analytics API
// ============================================================

/**
 * ดึง analytics สำหรับ dashboard
 */
export async function getAnalytics() {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('analytics_qr_performance')
    .select('*');
    
  if (error) throw error;
  return data;
}

/**
 * ดึง analytics ตามโครงการ
 */
export async function getProjectAnalytics() {
  const supabase = getSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('analytics_project_summary')
    .select('*');
    
  if (error) throw error;
  return data;
}
