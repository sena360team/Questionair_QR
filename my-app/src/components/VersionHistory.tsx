'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormVersion, FormField } from '@/types';
import { useFormVersions } from '@/hooks/useFormVersions';
import { Edit3 } from 'lucide-react';
import { FormRenderer } from './FormRenderer';
import { cn } from '@/lib/utils';
import {
  History,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getVersionBadgeStyle } from '@/lib/versionColors';

interface VersionHistoryProps {
  formId: string;
  currentVersion: number;
}

export function VersionHistory({ formId, currentVersion }: VersionHistoryProps) {
  const { versions, draftVersion, isLoading, error } = useFormVersions(formId);
  const router = useRouter();

  const [selectedVersion, setSelectedVersion] = useState<FormVersion | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleExpand = (version: number) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };



  const handleEditDraft = () => {
    if (draftVersion) {
      router.push(`/admin/forms/${formId}?draft=true`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </div>
    );
  }

  // Filter published versions only
  const publishedVersions = versions?.filter(v => v.status === 'published') || [];

  if (!versions || versions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>ไม่มีประวัติ version</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Version List */}
        <div className="space-y-4">
          {/* Draft Version Alert */}
          {draftVersion && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Edit3 className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">
                    มี Draft Version ที่กำลังแก้ไข
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    สร้างเมื่อ {formatDate(draftVersion.created_at, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={handleEditDraft}
                  className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  แก้ไข Draft
                </button>
              </div>
            </div>
          )}

          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5" />
            Published Versions ({publishedVersions.length})
          </h3>

          <div className="space-y-3">
            {publishedVersions.map((version) => {
              const isExpanded = expandedVersions.has(version.version);
              const isCurrent = version.version === currentVersion;

              return (
                <div
                  key={version.version}
                  className={cn(
                    "border rounded-xl overflow-hidden transition-all",
                    isCurrent ? "border-blue-500 bg-blue-50/50" : "border-slate-300 bg-white"
                  )}
                >
                  {/* Version Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50/50"
                    onClick={() => toggleExpand(version.version)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="px-2.5 py-1 rounded-lg text-sm font-medium border"
                          style={getVersionBadgeStyle(version.version)}
                        >
                          v{version.version}
                          {isCurrent && (
                            <span className="ml-1 text-xs opacity-75">(current)</span>
                          )}
                        </span>


                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">
                          {formatDate(version.published_at, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                      {version.change_summary || 'ไม่มีคำอธิบาย'}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {(version.fields as FormField[]).length} คำถาม
                      </span>

                    </div>
                  </div>

                  {/* Expanded Actions */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-200 pt-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVersion(version);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          ดูตัวอย่าง
                        </button>


                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Preview Panel */}
        <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50 min-h-[300px] max-h-[1400px] overflow-y-auto">
          {selectedVersion ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  ตัวอย่าง: v{selectedVersion.version}
                </h3>
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  ปิด
                </button>
              </div>

              {/* Preview Mode Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                <Eye className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">โหมดตัวอย่าง</p>
                  <p className="text-xs text-amber-600">ฟอร์มนี้แสดงตัวอย่างการใช้งานจริง แต่ไม่บันทึกข้อมูล</p>
                </div>
              </div>

              {/* Actual Form Preview with FormRenderer - No border, let FormRenderer handle header */}
              <div className="bg-white rounded-xl overflow-hidden">
                <FormRenderer
                  form={{
                    id: 'preview',
                    code: `v${selectedVersion.version}`,
                    slug: 'preview',
                    title: selectedVersion.title || '',
                    description: selectedVersion.description || '',
                    logo_url: selectedVersion.logo_url,
                    fields: selectedVersion.fields as FormField[],
                    require_consent: selectedVersion.require_consent,
                    consent_heading: selectedVersion.consent_heading,
                    consent_text: selectedVersion.consent_text,
                    consent_require_location: selectedVersion.consent_require_location,
                    is_active: true,
                    allow_multiple_responses: false,
                    status: 'published',
                    current_version: selectedVersion.version,
                    created_at: selectedVersion.published_at || '',
                    updated_at: selectedVersion.published_at || '',
                  }}
                  onSubmit={(data) => {
                    alert('นี่คือตัวอย่างฟอร์มเท่านั้น (Version History)\n\nข้อมูลที่กรอก:\n' + JSON.stringify(data, null, 2));
                  }}
                  submitting={false}
                  submitLabel="ส่งคำตอบ (ตัวอย่าง)"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>เลือก version เพื่อดูตัวอย่าง</p>
              <p className="text-sm mt-1">กด "ดูตัวอย่าง" ที่ version ที่ต้องการ</p>
            </div>
          )}
        </div>
      </div>


      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
            {toast.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
