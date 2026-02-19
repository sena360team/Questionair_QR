'use client';

import { Eye, Save, Rocket, GitBranch } from 'lucide-react';

interface ActionBarProps {
  onPreview: () => void;
  onSave?: () => void;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  isSaving?: boolean;
  formStatus?: 'draft' | 'published';
  nextVersion?: number;
}

export function ActionBar({
  onPreview,
  onSave,
  onSaveDraft,
  onPublish,
  isSaving = false,
  formStatus = 'draft',
  nextVersion
}: ActionBarProps) {
  console.log('[ActionBar] Render:', { formStatus, hasSave: !!onSave, hasSaveDraft: !!onSaveDraft, hasPublish: !!onPublish });

  return (
    <div className="flex items-center gap-2">
      {/* ดูตัวอย่าง - แสดงเสมอ */}
      <button
        onClick={() => {
          console.log('[ActionBar] Preview clicked');
          onPreview();
        }}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all"
      >
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline">ดูตัวอย่าง</span>
      </button>
      
      {/* บันทึก - สำหรับ form ที่ยังเป็น draft */}
      {formStatus === 'draft' && onSave && (
        <button
          onClick={() => {
            console.log('[ActionBar] Save clicked');
            onSave();
          }}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">บันทึก</span>
        </button>
      )}

      {/* บันทึก draft - สำหรับ published form ที่จะสร้าง draft */}
      {formStatus === 'published' && onSaveDraft && (
        <button
          onClick={() => {
            console.log('[ActionBar] Save Draft clicked');
            onSaveDraft();
          }}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GitBranch className="w-4 h-4" />
          <span className="hidden sm:inline">บันทึก draft</span>
        </button>
      )}

      {/* Publish - แสดงเสมอ */}
      {onPublish && (
        <button
          onClick={() => {
            console.log('[ActionBar] Publish clicked');
            onPublish();
          }}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Rocket className="w-4 h-4" />
          <span>Publish</span>
          {nextVersion && (
            <span className="hidden sm:inline text-green-100">v{nextVersion}</span>
          )}
        </button>
      )}
    </div>
  );
}
