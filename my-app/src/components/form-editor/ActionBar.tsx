'use client';

import { Eye, Save, Rocket } from 'lucide-react';

interface ActionBarProps {
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSaving?: boolean;
  nextVersion?: number;
}

export function ActionBar({
  onPreview,
  onSaveDraft,
  onPublish,
  isSaving = false,
  nextVersion
}: ActionBarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* ดูตัวอย่าง */}
      <button
        onClick={onPreview}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all"
      >
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline">ดูตัวอย่าง</span>
      </button>
      
      {/* บันทึก draft */}
      <button
        onClick={onSaveDraft}
        disabled={isSaving}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        <span className="hidden sm:inline">บันทึก draft</span>
      </button>

      {/* Publish */}
      <button
        onClick={onPublish}
        disabled={isSaving}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Rocket className="w-4 h-4" />
        <span>Publish</span>
        {nextVersion && (
          <span className="hidden sm:inline text-green-100">v{nextVersion}</span>
        )}
      </button>
    </div>
  );
}
