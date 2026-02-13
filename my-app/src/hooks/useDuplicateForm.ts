'use client';

import { useState, useCallback } from 'react';
import { DuplicateFormOptions, DuplicateFormResponse } from '@/types';
import { getFreshSupabaseClient } from '@/lib/supabase';

interface UseDuplicateFormReturn {
  duplicate: (
    formId: string,
    title: string,
    options: DuplicateFormOptions
  ) => Promise<DuplicateFormResponse>;
  isDuplicating: boolean;
  error: Error | null;
}

export function useDuplicateForm(): UseDuplicateFormReturn {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const duplicate = useCallback(async (
    formId: string,
    title: string,
    options: DuplicateFormOptions
  ): Promise<DuplicateFormResponse> => {
    setIsDuplicating(true);
    setError(null);
    
    try {
      const supabase = getFreshSupabaseClient();
      
      // Call the database function (public access - no auth required)
      const { data, error: rpcError } = await supabase.rpc('duplicate_form', {
        p_source_form_id: formId,
        p_new_title: title,
        p_copy_questions: options.copy_questions,
        p_copy_settings: options.copy_settings,
        p_copy_logo: options.copy_logo,
      });
      
      if (rpcError) {
        console.error('Duplicate error:', rpcError);
        throw new Error(rpcError.message || 'Failed to duplicate form');
      }
      
      // Debug: log what we got back
      console.log('Duplicate result:', data);
      
      // Parse the returned data
      let newFormId: string;
      let newCode: string;
      
      if (Array.isArray(data) && data.length > 0) {
        // If returned as array of objects: [{new_form_id, new_code}]
        const firstItem = data[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          newFormId = firstItem.new_form_id;
          newCode = firstItem.new_code;
        } else {
          // If returned as tuple: [uuid, code]
          [newFormId, newCode] = data as [string, string];
        }
      } else if (data && typeof data === 'object') {
        // If returned as single object
        newFormId = (data as any).new_form_id;
        newCode = (data as any).new_code;
      } else {
        throw new Error('Invalid response from server');
      }
      
      // Validate
      if (!newFormId || typeof newFormId !== 'string') {
        throw new Error('Invalid form ID returned from server');
      }
      
      return {
        new_form_id: newFormId,
        code: newCode,
        message: 'Form duplicated successfully',
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsDuplicating(false);
    }
  }, []);

  return {
    duplicate,
    isDuplicating,
    error,
  };
}
