// React Hooks for Supabase
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';
import type { Form, QRCode, Submission, Project, FormCreateInput, QRCodeCreateInput, ProjectCreateInput } from '@/types';

// ============================================================
// Projects
// ============================================================

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setProjects((data as Project[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = useCallback(async (input: ProjectCreateInput) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from('projects')
      .insert(input)
      .select()
      .single();
      
    if (error) throw error;
    setProjects(prev => [data as Project, ...prev]);
    return data as Project;
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    setProjects(prev => prev.map(p => p.id === id ? data as Project : p));
    return data as Project;
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  // Bulk import from Excel
  const importProjects = useCallback(async (data: ProjectCreateInput[]) => {
    const supabase = getSupabaseBrowser();
    const { data: imported, error } = await supabase
      .from('projects')
      .insert(data)
      .select();
      
    if (error) throw error;
    setProjects(prev => [...(imported as Project[]), ...prev]);
    return imported as Project[];
  }, []);

  return { projects, loading, error, refresh: fetchProjects, createProject, updateProject, deleteProject, importProjects };
}

// ============================================================
// Forms
// ============================================================

export function useForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();
      
      // Fetch forms with counts
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select(`
          *,
          qr_codes:qr_codes(count),
          submissions:submissions(count)
        `)
        .order('created_at', { ascending: false });
        
      if (formsError) throw formsError;
      
      // Fetch draft statuses
      const { data: draftsData, error: draftsError } = await supabase
        .from('form_drafts')
        .select('form_id, status');
        
      if (draftsError) throw draftsError;
      
      // Create draft lookup map
      const draftMap = new Map(draftsData?.map(d => [d.form_id, d.status]) || []);
      
      // Merge data
      const mergedForms = (formsData || []).map(form => ({
        ...form,
        has_draft: draftMap.has(form.id),
        draft_status: draftMap.get(form.id) || null,
      }));
      
      setForms(mergedForms as Form[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  const createForm = useCallback(async (input: FormCreateInput) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from('forms')
      .insert(input)
      .select()
      .single();
      
    if (error) throw error;
    setForms(prev => [data as Form, ...prev]);
    return data as Form;
  }, []);

  const updateForm = useCallback(async (id: string, updates: Partial<Form>) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from('forms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    setForms(prev => prev.map(f => f.id === id ? data as Form : f));
    return data as Form;
  }, []);

  const deleteForm = useCallback(async (id: string) => {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) throw error;
    setForms(prev => prev.filter(f => f.id !== id));
  }, []);

  const publishForm = useCallback(async (id: string, changeSummary?: string) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .rpc('publish_form', {
        p_form_id: id,
        p_change_summary: changeSummary || 'Publish ครั้งแรก'
      });
    if (error) throw error;
    
    // อัพเดท local state
    setForms(prev => prev.map(f => 
      f.id === id 
        ? { ...f, status: 'published', current_version: 1 } as Form
        : f
    ));
    return data as number;
  }, []);

  const createNewVersion = useCallback(async (id: string, changeSummary?: string) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .rpc('create_new_version', {
        p_form_id: id,
        p_change_summary: changeSummary
      });
    if (error) throw error;
    
    // อัพเดท local state
    setForms(prev => prev.map(f => 
      f.id === id 
        ? { ...f, current_version: data as number } as Form
        : f
    ));
    return data as number;
  }, []);

  return { forms, loading, error, refresh: fetchForms, createForm, updateForm, deleteForm, publishForm, createNewVersion };
}

export function useForm(slug: string) {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchForm() {
      if (!slug) { setLoading(false); return; }
      try {
        setLoading(true);
        const supabase = getSupabaseBrowser();
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (error) throw error;
        setForm(data as Form);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, [slug]);

  return { form, loading, error };
}

// ============================================================
// QR Codes
// ============================================================

export function useQRCodes(formId?: string) {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQRCodes = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();
      let query = supabase
        .from('qr_codes')
        .select(`
          *,
          project:projects(*)
        `)
        .order('created_at', { ascending: false });
        
      if (formId) {
        query = query.eq('form_id', formId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setQrCodes((data as QRCode[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => { fetchQRCodes(); }, [fetchQRCodes]);

  const createQRCode = useCallback(async (input: QRCodeCreateInput) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from('qr_codes')
      .insert(input)
      .select()
      .single();
      
    if (error) throw error;
    setQrCodes(prev => [data as QRCode, ...prev]);
    return data as QRCode;
  }, []);

  const updateQRCode = useCallback(async (id: string, updates: Partial<QRCode>) => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from('qr_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    setQrCodes(prev => prev.map(qr => qr.id === id ? data as QRCode : qr));
    return data as QRCode;
  }, []);

  const deleteQRCode = useCallback(async (id: string) => {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('qr_codes').delete().eq('id', id);
    if (error) throw error;
    setQrCodes(prev => prev.filter(qr => qr.id !== id));
  }, []);

  return { qrCodes, loading, error, refresh: fetchQRCodes, createQRCode, updateQRCode, deleteQRCode };
}

// ============================================================
// Submissions
// ============================================================

export function useSubmissions(formId?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();
      let query = supabase
        .from('submissions')
        .select(`
          *,
          qr_code:qr_codes(name, qr_slug)
        `)
        .order('submitted_at', { ascending: false });
        
      if (formId) {
        query = query.eq('form_id', formId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setSubmissions((data as Submission[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  return { submissions, loading, error, refresh: fetchSubmissions };
}

export function useSubmitForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(async (
    formId: string,
    responses: Record<string, unknown>,
    options?: {
      qrCodeId?: string;
      projectId?: string;
      utmParams?: { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string; };
      fingerprint?: string;
      metadata?: Record<string, unknown>;
    }
  ) => {
    try {
      setSubmitting(true);
      setError(null);
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
      return data as Submission;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit form'));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting, error };
}
