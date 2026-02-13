'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormVersion, FormField } from '@/types';
import { useFormVersions } from '@/hooks/useFormVersions';
import { useDuplicateForm } from '@/hooks/useDuplicateForm';
import { FormRenderer } from './FormRenderer';
import { cn } from '@/lib/utils';
import { 
  History, 
  RotateCcw, 
  Copy, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  User,
  Calendar,
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
  const { versions, isLoading, error, revertToVersion } = useFormVersions(formId);
  const { duplicate, isDuplicating } = useDuplicateForm();
  const router = useRouter();
  
  const [selectedVersion, setSelectedVersion] = useState<FormVersion | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
  const [showRevertConfirm, setShowRevertConfirm] = useState<FormVersion | null>(null);
  const [revertNotes, setRevertNotes] = useState('');
  const [isReverting, setIsReverting] = useState(false);

  const toggleExpand = (version: number) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  const handleRevert = async () => {
    if (!showRevertConfirm) return;
    
    setIsReverting(true);
    try {
      const result = await revertToVersion(showRevertConfirm.version, revertNotes);
      router.push(`/admin/forms/${formId}?draft=true`);
    } catch (err) {
      console.error('Revert failed:', err);
      alert('เกิดข้อผิดพลาดในการ revert');
    } finally {
      setIsReverting(false);
      setShowRevertConfirm(null);
    }
  };

  const handleDuplicate = async (version: FormVersion) => {
    try {
      const title = `${version.title || 'Form'} (v${version.version} Copy)`;
      const result = await duplicate(formId, title, {
        copy_questions: true,
        copy_settings: true,
        copy_logo: !!version.logo_url,
        copy_qr_codes: false,
      });
      router.push(`/admin/forms/${result.new_form_id}`);
    } catch (err) {
      console.error('Duplicate failed:', err);
      alert('เกิดข้อผิดพลาดในการคัดลอก');
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
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History ({versions.length})
          </h3>
          
          <div className="space-y-3">
            {versions.map((version) => {
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
                        
                        {version.is_reverted && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                            Reverted
                          </span>
                        )}
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
                      {version.published_by_user && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {version.published_by_user.email}
                        </span>
                      )}
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
                        
                        {!isCurrent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRevertConfirm(version);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Revert กลับเวอร์ชันนี้
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(version);
                          }}
                          disabled={isDuplicating}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Copy className="w-4 h-4" />
                          {isDuplicating ? 'กำลังคัดลอก...' : 'คัดลอกเป็นฟอร์มใหม่'}
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
        <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50 overflow-y-auto max-h-[calc(100vh-200px)]">
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
              
              {/* Actual Form Preview with FormRenderer */}
              <div className="bg-white rounded-xl border-2 border-slate-300 overflow-hidden shadow-lg">
                {/* Form Header */}
                <div className="bg-gradient-to-b from-blue-600 to-blue-500 p-6 text-center text-white">
                  {selectedVersion.logo_url && (
                    <img 
                      src={selectedVersion.logo_url} 
                      alt="Logo" 
                      className="h-12 mx-auto object-contain mb-3"
                    />
                  )}
                  <h4 className="text-lg font-bold">
                    {selectedVersion.title || 'Untitled Form'}
                  </h4>
                  {selectedVersion.description && (
                    <p className="text-blue-100 text-sm mt-1">
                      {selectedVersion.description}
                    </p>
                  )}
                </div>
                
                {/* Interactive Form */}
                <div className="p-6">
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
      
      {/* Revert Confirmation Modal */}
      {showRevertConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-lg font-semibold">ยืนยันการ Revert</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
              คุณต้องการ revert กลับไป <strong>Version {showRevertConfirm.version}</strong> ใช่หรือไม่?
            </p>
            
            <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm text-slate-600">
              <p className="font-medium mb-2">สิ่งที่จะเกิดขึ้น:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>ระบบจะสร้าง Draft จาก Version {showRevertConfirm.version}</li>
                <li>คุณสามารถแก้ไขเพิ่มเติมก่อน Publish</li>
                <li>ฟอร์มปัจจุบันยังใช้งานได้จนกว่าจะ Publish</li>
              </ul>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                เหตุผล (optional)
              </label>
              <textarea
                value={revertNotes}
                onChange={(e) => setRevertNotes(e.target.value)}
                placeholder="เช่น: ต้องการกลับไปใช้คำถามเวอร์ชันเก่า..."
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRevertConfirm(null)}
                className="flex-1 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRevert}
                disabled={isReverting}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isReverting ? 'กำลังดำเนินการ...' : 'ยืนยัน Revert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
