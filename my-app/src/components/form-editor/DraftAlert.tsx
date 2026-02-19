'use client';

import { Edit3 } from 'lucide-react';

interface DraftAlertProps {
  currentVersion: number;
  onDelete: () => void;
  onPublish: () => void;
}

export function DraftAlert({ currentVersion, onDelete, onPublish }: DraftAlertProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-t-xl px-4 py-3 flex items-center gap-3">
      <Edit3 className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        <span className="font-medium">กำลังแก้ไข Draft</span>
        <span className="hidden sm:inline"> · ฟอร์มที่แสดงผลให้ผู้ตอบแบบสอบถามเห็นคือ V{currentVersion} (Publish)</span>
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onDelete}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
        >
          ลบ Draft
        </button>
        <button
          onClick={onPublish}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
        >
          Publish
        </button>
      </div>
    </div>
  );
}
