'use client';

import { Edit3 } from 'lucide-react';

interface DraftAlertProps {
  currentVersion: number;
}

export function DraftAlert({ currentVersion }: DraftAlertProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-t-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Edit3 className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">กำลังแก้ไข Draft</span>
          <span className="hidden sm:inline text-amber-700">
            {' · '}ฟอร์มที่แสดงผลให้ผู้ตอบแบบสอบถามเห็นคือ V{currentVersion} (Publish)
          </span>
        </p>
        <p className="text-xs text-amber-600 sm:hidden">
          ฟอร์มที่แสดงผล: V{currentVersion} (Publish)
        </p>
      </div>
    </div>
  );
}
