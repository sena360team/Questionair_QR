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
  Clock,
  CheckCircle,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Form } from '@/types';
import { getVersionBadgeStyle } from '@/lib/versionColors';

export default function FormsPage() {
  const { forms, loading, deleteForm } = useForms();
  const { submissions } = useSubmissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [duplicateForm, setDuplicateForm] = useState<Form | null>(null);

  // Calculate stats
  const totalForms = forms.length;
  const publishedCount = forms.filter(f => f.status === 'published').length;
  const draftCount = forms.filter(f => f.status === 'draft').length;
  const totalSubmissions = submissions.length;

  const filteredForms = forms.filter(form => {
    const matchesSearch = 
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    await deleteForm(id);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">แบบสอบถาม</h1>
          <p className="text-slate-500 mt-1">จัดการแบบสอบถามทั้งหมดของคุณ</p>
        </div>
        <Link
          href="/admin/forms/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          สร้างใหม่
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">ทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-900">{totalForms}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Published</p>
            <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Edit3 className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Draft</p>
            <p className="text-2xl font-bold text-amber-600">{draftCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">คำตอบรวม</p>
            <p className="text-2xl font-bold text-blue-600">{totalSubmissions}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่อ รหัส หรือ slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 min-w-[140px]"
          >
            <option value="all">ทั้งหมด</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchTerm ? 'ไม่พบแบบสอบถาม' : 'ยังไม่มีแบบสอบถาม'}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'สร้างแบบสอบถามแรกของคุณเลย'}
          </p>
          {!searchTerm && (
            <Link
              href="/admin/forms/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              สร้างแบบสอบถาม
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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

  // Get status color
  const getStatusColor = () => {
    switch (form.status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-amber-400';
      case 'archived': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all group cursor-pointer">
      {/* Top Status Bar */}
      <div className={`h-1 ${getStatusColor()}`}></div>
      
      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">{form.code}</span>
                {form.status === 'published' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Published</span>
                )}
                {form.status === 'draft' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Draft</span>
                )}
                {form.status === 'archived' && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">Archived</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
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
              </div>
            </div>
          </div>
          
          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
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
                      {form.has_draft ? 'แก้ไข Draft ที่ร่างไว้' : 'แก้ไข (Draft)'}
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

        {/* Title - Fixed 2 lines height */}
        <h3 className="font-semibold text-slate-900 mb-3 text-lg leading-snug line-clamp-2 h-[3.5rem]" title={form.title}>
          {form.title}
        </h3>

        {/* Status Badge */}
        <div className="mb-4">
          {form.status === 'published' && (
            form.is_active ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                เปิดใช้งาน
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                ปิดใช้งาน
              </span>
            )
          )}
          {form.status === 'draft' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 text-sm rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              ยังไม่ Publish
            </span>
          )}
        </div>

        {/* Stats Row: คำถามก่อนคำตอบ */}
        <div className="flex items-center gap-6 text-sm border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{form.fields?.length || 0} คำถาม</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>{submissionCount} คำตอบ</span>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(form.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* View Form Button - Published only */}
          {form.status === 'published' ? (
            <Link
              href={`/form/${form.slug}`}
              target="_blank"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="ดูแบบสอบถาม"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          ) : (
            <span
              className="p-2 text-slate-300 cursor-not-allowed rounded-lg"
              title="ยังไม่สามารถดูได้"
            >
              <ExternalLink className="w-4 h-4" />
            </span>
          )}
          
          {/* QR Code Button - Published only */}
          {form.status === 'published' && (
            <Link
              href={`/admin/qr-codes?form=${form.id}`}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="QR Code"
              onClick={(e) => e.stopPropagation()}
            >
              <QrCode className="w-4 h-4" />
            </Link>
          )}
          
          {/* Edit Button */}
          <Link
            href={form.status === 'published' ? `/admin/forms/${form.id}?draft=true` : `/admin/forms/${form.id}`}
            className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            title="แก้ไข"
            onClick={(e) => e.stopPropagation()}
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
