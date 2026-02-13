'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useForms, useSubmissions } from '@/hooks/useSupabase';
import { DuplicateFormDialog } from '@/components/DuplicateFormDialog';
import { 
  FileText, 
  Plus, 
  Search, 
  ExternalLink,
  Edit,
  Trash2,
  QrCode,
  BarChart3,
  Hash,
  Copy,
  MoreVertical,
  Edit3,
  Clock
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Form } from '@/types';
import { getVersionBadgeStyle } from '@/lib/versionColors';
import { cn } from '@/lib/utils';

export default function FormsPage() {
  const { forms, loading, deleteForm } = useForms();
  const { submissions } = useSubmissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [duplicateForm, setDuplicateForm] = useState<Form | null>(null);

  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await deleteForm(id);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">แบบสอบถาม</h1>
          <p className="text-slate-500">จัดการแบบสอบถามทั้งหมดของคุณ</p>
        </div>
        <Link
          href="/admin/forms/create"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          สร้างใหม่
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาด้วยชื่อ รหัส หรือ slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-slate-300">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchTerm ? 'ไม่พบแบบสอบถาม' : 'ยังไม่มีแบบสอบถาม'}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'สร้างแบบสอบถามแรกของคุณเลย'}
          </p>
          {!searchTerm && (
            <Link
              href="/admin/forms/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              สร้างแบบสอบถาม
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 lg:gap-6">
          {filteredForms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              submissionCount={submissions.filter(s => s.form_id === form.id).length}
              onDelete={() => setShowDeleteConfirm(form.id)}
              onDuplicate={() => setDuplicateForm(form)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {/* Duplicate Dialog */}
      {duplicateForm && (
        <DuplicateFormDialog
          form={duplicateForm}
          isOpen={true}
          onClose={() => setDuplicateForm(null)}
        />
      )}
    </div>
  );
}

// ==================== Components ====================

interface FormCardProps {
  form: Form;
  submissionCount: number;
  onDelete: () => void;
  onDuplicate: () => void;
}

function FormCard({ form, submissionCount, onDelete, onDuplicate }: FormCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all group flex flex-col">
      {/* Card Header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded">
                  {form.code}
                </span>
                {/* Status Badge */}
                {form.status === 'draft' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                    Draft
                  </span>
                )}
                {form.status === 'published' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    Published
                  </span>
                )}
                {form.status === 'archived' && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                    Archived
                  </span>
                )}
              </div>
              {/* Version & Draft Badge */}
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-0.5 text-xs rounded-full font-medium border"
                  style={getVersionBadgeStyle(form.current_version || 0)}
                >
                  Version {form.current_version || 0}
                </span>
                {form.has_draft && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    มี Draft
                  </span>
                )}
                {form.cloned_from && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                    <Copy className="w-3 h-3" />
                    Copy
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-20 py-1">
                  <Link
                    href={`/admin/forms/${form.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowActions(false)}
                  >
                    <Edit className="w-4 h-4" />
                    แก้ไข
                  </Link>
                  
                  {form.status === 'published' && (
                    <Link
                      href={`/admin/forms/${form.id}?draft=true`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                      onClick={() => setShowActions(false)}
                    >
                      <Edit3 className="w-4 h-4" />
                      {form.has_draft ? 'ต่อ Draft' : 'แก้ไข (Draft)'}
                    </Link>
                  )}
                  
                  <Link
                    href={`/admin/forms/${form.id}?tab=history`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowActions(false)}
                  >
                    <Clock className="w-4 h-4" />
                    ประวัติ Version
                  </Link>
                  
                  <button
                    onClick={() => {
                      onDuplicate();
                      setShowActions(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                  >
                    <Copy className="w-4 h-4" />
                    คัดลอกเป็นฟอร์มใหม่
                  </button>
                  
                  <hr className="my-1 border-slate-200" />
                  
                  <button
                    onClick={() => {
                      onDelete();
                      setShowActions(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    ลบ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1" title={form.title}>{form.title}</h3>
        <p className="text-sm text-slate-500 mb-3 truncate">/{form.slug}</p>

        {/* Active/Inactive Badge */}
        {form.status === 'published' && (
          form.is_active ? (
            <span className="inline-flex px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full mb-3">
              เปิดใช้งาน
            </span>
          ) : (
            <span className="inline-flex px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium mb-3">
              ปิดใช้งาน
            </span>
          )
        )}

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <BarChart3 className="w-4 h-4" />
            <span>{submissionCount} คำตอบ</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Hash className="w-4 h-4" />
            <span>{form.fields?.length || 0} คำถาม</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {formatDate(form.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        
        <div className="flex items-center gap-1">
          {/* View Form Button - Published only */}
          {form.status === 'published' ? (
            <Link
              href={`/form/${form.slug}`}
              target="_blank"
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all border border-blue-200 hover:border-blue-300"
              title="ไปที่แบบสอบถาม"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          ) : (
            <span
              className="p-2 text-slate-300 cursor-not-allowed rounded-lg border border-slate-100"
              title="ยังไม่สามารถดูได้ (รอ Publish)"
            >
              <ExternalLink className="w-4 h-4" />
            </span>
          )}
          
          {/* QR Code Button - Published only */}
          {form.status === 'published' && (
            <Link
              href={`/admin/qr-codes?form=${form.id}`}
              className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all border border-purple-200 hover:border-purple-300"
              title="จัดการ QR Code"
            >
              <QrCode className="w-4 h-4" />
            </Link>
          )}
          
          {/* Edit Button */}
          <Link
            href={form.status === 'published' ? `/admin/forms/${form.id}?draft=true` : `/admin/forms/${form.id}`}
            className="p-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 hover:border-blue-200"
            title={form.status === 'published' ? 'แก้ไข (Draft)' : 'แก้ไข'}
          >
            <Edit className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
          ยืนยันการลบ?
        </h3>
        <p className="text-slate-500 text-center text-sm mb-6">
          การลบไม่สามารถเรียกคืนได้
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700"
          >
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
}
