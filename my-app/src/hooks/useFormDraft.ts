// ============================================================
// useFormDraft.ts — React Hook สำหรับจัดการ Draft
// เปลี่ยนจาก Supabase Client → ใช้ fetch /api/form-draft/[formId] แทน
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { FormDraft, FormDraftCreateInput, DraftStatus } from '@/types';

interface UseFormDraftReturn {
  draft: FormDraft | null | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refresh: () => void;
  saveDraft: (data: Partial<FormDraftCreateInput>) => Promise<void>;
  submitForReview: (notes?: string) => Promise<void>;
  approve: (reviewNotes?: string) => Promise<void>;
  reject: (reviewNotes: string) => Promise<void>;
  discard: () => Promise<void>;
}

export function useFormDraft(formId: string): UseFormDraftReturn {
  const [draft, setDraft] = useState<FormDraft | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  const fetchDraft = useCallback(async () => {
    if (!formId) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/form-draft/${formId}`);
      if (res.status === 404) { setDraft(null); return; }
      if (!res.ok) throw new Error(await res.text());
      setDraft(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch draft'));
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => { fetchDraft(); }, [fetchDraft]);

  const saveDraft = useCallback(async (draftData: Partial<FormDraftCreateInput>) => {
    const res = await fetch(`/api/form-draft/${formId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draftData, status: 'editing' }),
    });
    if (!res.ok) throw new Error('Failed to save draft');
    await fetchDraft();
  }, [formId, fetchDraft]);

  const submitForReview = useCallback(async (notes?: string) => {
    const res = await fetch(`/api/form-draft/${formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', notes }),
    });
    if (!res.ok) throw new Error('Failed to submit for review');
    await fetchDraft();
  }, [formId, fetchDraft]);

  const approve = useCallback(async (reviewNotes?: string) => {
    const res = await fetch(`/api/form-draft/${formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', reviewNotes }),
    });
    if (!res.ok) throw new Error('Failed to approve');
    await fetchDraft();
  }, [formId, fetchDraft]);

  const reject = useCallback(async (reviewNotes: string) => {
    const res = await fetch(`/api/form-draft/${formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reviewNotes }),
    });
    if (!res.ok) throw new Error('Failed to reject');
    await fetchDraft();
  }, [formId, fetchDraft]);

  const discard = useCallback(async () => {
    const res = await fetch(`/api/form-draft/${formId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to discard draft');
    setDraft(null);
  }, [formId]);

  return { draft, isLoading, error, refresh: fetchDraft, saveDraft, submitForReview, approve, reject, discard };
}
