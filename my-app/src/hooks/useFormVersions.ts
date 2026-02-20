'use client';

import { useState, useEffect, useCallback } from 'react';
import { FormVersion } from '@/types';

interface UseFormVersionsReturn {
  versions: FormVersion[];
  currentVersion: FormVersion | null;
  draftVersion: FormVersion | null;
  hasDraft: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  createDraft: (data: any) => Promise<FormVersion>;
  updateDraft: (versionId: string, data: any) => Promise<void>;
  publishDraft: (versionId: string, changeSummary?: string) => Promise<void>;
  deleteDraft: (versionId: string) => Promise<void>;
}

export function useFormVersions(formId: string): UseFormVersionsReturn {
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<FormVersion | null>(null);
  const [draftVersion, setDraftVersion] = useState<FormVersion | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!formId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/form-versions?formId=${formId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch versions');
      }
      
      // Versions now have computed status field from API
      const versionsWithStatus = (result.data.versions || []).map((v: any) => ({
        ...v,
        status: v.is_draft ? 'draft' : 'published',
      }));
      
      console.log('[useFormVersions] API Response:', {
        current_version: result.data.current_version,
        versions: versionsWithStatus.map((v: any) => ({ 
          id: v.id, 
          version: v.version, 
          is_draft: v.is_draft, 
          status: v.status,
          published_at: v.published_at 
        }))
      });
      
      setVersions(versionsWithStatus);
      
      // Find current version
      const current = versionsWithStatus.find((v: FormVersion) => 
        v.version === result.data.current_version
      ) || null;
      setCurrentVersion(current);
      
      // Find draft version
      const draft = versionsWithStatus.find((v: FormVersion) => v.status === 'draft') || null;
      
      console.log('[useFormVersions] Draft found:', draft ? {
        id: draft.id,
        version: draft.version,
        status: draft.status,
        published_at: draft.published_at
      } : 'null');
      
      setDraftVersion(draft);
      setHasDraft(!!draft);
    } catch (err) {
      console.error('Form versions error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch versions'));
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const createDraft = useCallback(async (data: any): Promise<FormVersion> => {
    const response = await fetch('/api/form-versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId, ...data }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('Create draft API error:', result);
      throw new Error(result.error || 'Failed to create draft');
    }
    
    await fetchVersions();
    return result.data;
  }, [formId, fetchVersions]);

  const updateDraft = useCallback(async (versionId: string, data: any) => {
    const response = await fetch(`/api/form-versions/${versionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update draft');
    }
    
    await fetchVersions();
  }, [fetchVersions]);

  const publishDraft = useCallback(async (versionId: string, changeSummary?: string) => {
    const response = await fetch('/api/form-versions/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId, changeSummary }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to publish draft');
    }
    
    await fetchVersions();
  }, [fetchVersions]);

  const deleteDraft = useCallback(async (versionId: string) => {
    const response = await fetch(`/api/form-versions/${versionId}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete draft');
    }
    
    await fetchVersions();
  }, [fetchVersions]);

  return {
    versions,
    currentVersion,
    draftVersion,
    hasDraft,
    isLoading,
    error,
    refresh: fetchVersions,
    createDraft,
    updateDraft,
    publishDraft,
    deleteDraft,
  };
}
