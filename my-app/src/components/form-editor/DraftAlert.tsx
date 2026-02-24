'use client';

import { Edit3 } from 'lucide-react';

interface DraftAlertProps {
  currentVersion: number | null;
  draftVersionNumber?: number | null;
}

export function DraftAlert({ currentVersion, draftVersionNumber }: DraftAlertProps) {
  // ถ้ายังไม่มี published version (null) → "กำลังแก้ไข Draft" (ไม่แสดงเลข v)
  // ถ้ามี published version แล้ว → "กำลังแก้ไข Draft v{N}"
  const hasPublishedVersion = currentVersion !== null && currentVersion !== undefined;
  const showDraftVersion = draftVersionNumber && draftVersionNumber > 1;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-t-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Edit3 className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">
            กำลังแก้ไข Draft{showDraftVersion ? ` v${draftVersionNumber}` : ''}
          </span>
          {hasPublishedVersion && (
            <span className="hidden sm:inline text-amber-700">
              {' · '}ผู้ตอบแบบสอบถามเห็น v{currentVersion} (Published)
            </span>
          )}
        </p>
        {hasPublishedVersion && (
          <p className="text-xs text-amber-600 sm:hidden">
            ผู้ตอบเห็น: v{currentVersion} (Published)
          </p>
        )}
      </div>
    </div>
  );
}
