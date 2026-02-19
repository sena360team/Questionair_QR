'use client';

import Link from 'next/link';
import { Copy, Trash2 } from 'lucide-react';

interface FormHeaderV4Props {
  formCode: string;
  formTitle: string;
  onCopy: () => void;
  onDeleteDraft?: () => void;
  hasDraft?: boolean;
}

export function FormHeaderV4({ 
  formCode, 
  formTitle, 
  onCopy, 
  onDeleteDraft,
  hasDraft 
}: FormHeaderV4Props) {
  return (
    <div className="px-4 py-4 border-b border-slate-100">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-2">
        <Link 
          href="/admin/forms"
          className="text-slate-500 hover:text-slate-700 transition-colors"
        >
          ฟอร์ม
        </Link>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
        </svg>
        <span className="text-slate-900 font-medium">{formCode}</span>
      </div>
      
      {/* Form Name & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 leading-tight">
          {formTitle}
        </h1>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onCopy}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            คัดลอก
          </button>
          {hasDraft && onDeleteDraft && (
            <button
              onClick={onDeleteDraft}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ลบ Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
