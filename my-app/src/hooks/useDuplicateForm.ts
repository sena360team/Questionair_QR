// ============================================================
// useDuplicateForm.ts — Hook สำหรับคัดลอกแบบสอบถาม
// เปลี่ยนจาก Supabase RPC → ใช้ fetch /api/forms/[id]/duplicate แทน
// ============================================================

'use client';

import { useState } from 'react';

interface DuplicateOptions {
  copy_questions?: boolean;
  copy_settings?: boolean;
  copy_logo?: boolean;
}

export function useDuplicateForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const duplicateForm = async (
    formId: string,
    title: string,
    options: DuplicateOptions = {}
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forms/${formId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          copy_questions: options.copy_questions ?? true,
          copy_settings: options.copy_settings ?? true,
          copy_logo: options.copy_logo ?? true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to duplicate form');
      }

      const data = await res.json();
      return data.newFormId as string;
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Failed to duplicate form');
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { duplicateForm, loading, error };
}
