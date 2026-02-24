// ============================================================
// useSupabase.ts — React Hooks สำหรับ Fetch Data
// เปลี่ยนจาก Supabase Client → ใช้ fetch เรียก API Routes แทน
// ทุก hook เรียก /api/... เพื่อดึงและแก้ไขข้อมูล
// ============================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
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
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error(await res.text());
      setProjects(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = useCallback(async (input: ProjectCreateInput) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    const project = await res.json();
    setProjects(prev => [project, ...prev]);
    return project as Project;
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await res.text());
    const project = await res.json();
    setProjects(prev => prev.map(p => p.id === id ? project : p));
    return project as Project;
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const importProjects = useCallback(async (data: ProjectCreateInput[]) => {
    const results: Project[] = [];
    for (const item of data) {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) results.push(await res.json());
    }
    setProjects(prev => [...results, ...prev]);
    return results;
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
      const res = await fetch('/api/forms');
      if (!res.ok) throw new Error(await res.text());
      setForms(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  const createForm = useCallback(async (input: FormCreateInput) => {
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    const form = await res.json();
    setForms(prev => [form, ...prev]);
    return form as Form;
  }, []);

  const updateForm = useCallback(async (id: string, updates: Partial<Form>) => {
    const res = await fetch(`/api/forms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await res.text());
    const form = await res.json();
    setForms(prev => prev.map(f => f.id === id ? form : f));
    return form as Form;
  }, []);

  const deleteForm = useCallback(async (id: string) => {
    const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    setForms(prev => prev.filter(f => f.id !== id));
  }, []);

  const publishForm = useCallback(async (id: string, changeSummary?: string) => {
    const res = await fetch(`/api/forms/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeSummary }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setForms(prev => prev.map(f =>
      f.id === id ? { ...f, status: 'published', current_version: data.version } as Form : f
    ));
    return data.version as number;
  }, []);

  const createNewVersion = useCallback(async (id: string, changeSummary?: string) => {
    const res = await fetch(`/api/forms/${id}/new-version`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeSummary }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setForms(prev => prev.map(f =>
      f.id === id ? { ...f, current_version: data.version } as Form : f
    ));
    return data.version as number;
  }, []);

  return { forms, loading, error, refresh: fetchForms, createForm, updateForm, deleteForm, publishForm, createNewVersion };
}

export function useForm(slug: string) {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    fetch(`/api/forms/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Form not found')))
      .then(data => setForm(data as Form))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
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
      const url = formId ? `/api/qr-codes?formId=${formId}` : '/api/qr-codes';
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      setQrCodes(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => { fetchQRCodes(); }, [fetchQRCodes]);

  const createQRCode = useCallback(async (input: QRCodeCreateInput) => {
    const res = await fetch('/api/qr-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    const qrCode = await res.json();
    setQrCodes(prev => [qrCode, ...prev]);
    return qrCode as QRCode;
  }, []);

  const updateQRCode = useCallback(async (id: string, updates: Partial<QRCode>) => {
    const res = await fetch(`/api/qr-codes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await res.text());
    const qrCode = await res.json();
    setQrCodes(prev => prev.map(qr => qr.id === id ? qrCode : qr));
    return qrCode as QRCode;
  }, []);

  const deleteQRCode = useCallback(async (id: string) => {
    const res = await fetch(`/api/qr-codes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
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
      const url = formId
        ? `/api/forms/${formId}/submissions`
        : '/api/submissions';
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // API ส่งมาเป็น { submissions: [...], ... } ถ้ามี formId
      setSubmissions(Array.isArray(data) ? data : (data.submissions || []));
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
      const res = await fetch(`/api/forms/${formId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          qr_code_id: options?.qrCodeId,
          project_id: options?.projectId,
          utm_source: options?.utmParams?.utm_source,
          utm_medium: options?.utmParams?.utm_medium,
          utm_campaign: options?.utmParams?.utm_campaign,
          utm_content: options?.utmParams?.utm_content,
          utm_term: options?.utmParams?.utm_term,
          fingerprint: options?.fingerprint,
          metadata: options?.metadata,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json() as Submission;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit form'));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting, error };
}
