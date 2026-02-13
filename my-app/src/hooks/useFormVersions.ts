'use client';

import { useState, useEffect, useCallback } from 'react';
import { FormVersion, RevertFormResponse } from '@/types';
import { getSupabaseBrowser } from '@/lib/supabase';

interface UseFormVersionsReturn {
  versions: FormVersion[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refresh: () => void;
  revertToVersion: (version: number, notes?: string) => Promise<RevertFormResponse>;
}

export function useFormVersions(formId: string): UseFormVersionsReturn {
  const [versions, setVersions] = useState<FormVersion[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  const fetchVersions = useCallback(async () => {
    if (!formId) return;
    
    setIsLoading(true);
    setError(undefined);
    
    try {
      const supabase = getSupabaseBrowser();
      
      const { data: versionsData, error: fetchError } = await supabase
        .from('form_versions')
        .select(`
          *,
          published_by_user:published_by(id, email)
        `)
        .eq('form_id', formId)
        .order('version', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setVersions(versionsData || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch versions'));
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const revertToVersion = useCallback(async (
    version: number, 
    notes?: string
  ): Promise<RevertFormResponse> => {
    const supabase = getSupabaseBrowser();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Call the database function
    const { data, error: rpcError } = await supabase.rpc('create_draft_from_version', {
      p_form_id: formId,
      p_version: version,
      p_user_id: user.id,
      p_notes: notes || null,
    });
    
    if (rpcError) {
      console.error('Revert error:', rpcError);
      throw new Error(rpcError.message || 'Failed to revert to version');
    }
    
    // Refresh data
    await fetchVersions();
    
    return {
      draft_id: data,
      message: `Draft created from version ${version}`,
    };
  }, [formId, fetchVersions]);

  return {
    versions,
    isLoading,
    error,
    refresh: fetchVersions,
    revertToVersion,
  };
}
