'use client';

import { useState, useEffect, useCallback } from 'react';
import { FormDraft, FormDraftCreateInput, DraftStatus } from '@/types';
import { getSupabaseBrowser } from '@/lib/supabase';

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
      const supabase = getSupabaseBrowser();
      
      const { data: draftData, error: fetchError } = await supabase
        .from('form_drafts')
        .select('*')
        .eq('form_id', formId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Form draft fetch error:', fetchError);
        // Don't throw, just set draft to null
        setDraft(null);
      } else {
        setDraft(draftData);
      }
    } catch (err) {
      console.error('Form draft error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch draft'));
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const saveDraft = useCallback(async (draftData: Partial<FormDraftCreateInput>) => {
    const supabase = getSupabaseBrowser();
    
    const upsertData = {
      form_id: formId,
      ...draftData,
      status: 'editing' as DraftStatus,
      updated_at: new Date().toISOString(),
    };
    
    const { error: upsertError } = await supabase
      .from('form_drafts')
      .upsert(upsertData, {
        onConflict: 'form_id',
      });
    
    if (upsertError) {
      console.error('Save draft error:', upsertError);
      throw new Error(upsertError.message || 'Failed to save draft');
    }
    
    await fetchDraft();
  }, [formId, fetchDraft]);

  const submitForReview = useCallback(async (notes?: string) => {
    const supabase = getSupabaseBrowser();
    
    const { error: updateError } = await supabase
      .from('form_drafts')
      .update({
        status: 'pending_review' as DraftStatus,
        submitted_at: new Date().toISOString(),
        submitted_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('form_id', formId);
    
    if (updateError) {
      console.error('Submit for review error:', updateError);
      throw new Error(updateError.message || 'Failed to submit for review');
    }
    
    await fetchDraft();
  }, [formId, fetchDraft]);

  const approve = useCallback(async (reviewNotes?: string) => {
    const supabase = getSupabaseBrowser();
    
    const { error: updateError } = await supabase
      .from('form_drafts')
      .update({
        status: 'approved' as DraftStatus,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('form_id', formId);
    
    if (updateError) {
      console.error('Approve error:', updateError);
      throw new Error(updateError.message || 'Failed to approve');
    }
    
    await fetchDraft();
  }, [formId, fetchDraft]);

  const reject = useCallback(async (reviewNotes: string) => {
    const supabase = getSupabaseBrowser();
    
    const { error: updateError } = await supabase
      .from('form_drafts')
      .update({
        status: 'rejected' as DraftStatus,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('form_id', formId);
    
    if (updateError) {
      console.error('Reject error:', updateError);
      throw new Error(updateError.message || 'Failed to reject');
    }
    
    await fetchDraft();
  }, [formId, fetchDraft]);

  const discard = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    
    const { error: deleteError } = await supabase
      .from('form_drafts')
      .delete()
      .eq('form_id', formId);
    
    if (deleteError) {
      console.error('Discard error:', deleteError);
      throw new Error(deleteError.message || 'Failed to discard draft');
    }
    
    setDraft(null);
  }, [formId]);

  return {
    draft,
    isLoading,
    error,
    refresh: fetchDraft,
    saveDraft,
    submitForReview,
    approve,
    reject,
    discard,
  };
}
