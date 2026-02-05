'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForms, useSubmissions } from '@/hooks/useSupabase';
import { 
  FileText, 
  Plus, 
  Search, 
  ExternalLink,
  Edit,
  Trash2,
  QrCode,
  BarChart3,
  Hash
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Form } from '@/types';
import { getVersionBadgeStyle, getVersionBadgeClass } from '@/lib/versionColors';

export default function FormsPage() {
  const { forms, loading, deleteForm } = useForms();
  const { submissions } = useSubmissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">แบบสอบถาม</h1>
          <p className="text-slate-500">จัดการแบบสอบถามทั้งหมดของคุณ</p>
        </div>
        <Link
          href="/admin/forms/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
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
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              submissionCount={submissions.filter(s => s.form_id === form.id).length}
              onDelete={() => setShowDeleteConfirm(form.id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
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
}

function FormCard({ form, submissionCount, onDelete }: FormCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all group">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded">
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
                {/* Version Badge - Dynamic Color */}
                <span 
                  className="px-2 py-0.5 text-xs rounded-full font-medium border"
                  style={getVersionBadgeStyle(form.current_version || 0)}
                >
                  Version {form.current_version || 0}
                </span>
              </div>
              {/* Active/Inactive Badge */}
              {form.status === 'published' && (
                form.is_active ? (
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">
                    เปิดใช้งาน
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                    ปิดใช้งาน
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{form.title}</h3>
        <p className="text-sm text-slate-500 mb-4">/{form.slug}</p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <BarChart3 className="w-4 h-4" />
            <span>{submissionCount} คำตอบ</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <FileText className="w-4 h-4" />
            <span>{form.fields?.length || 0} คำถาม</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {formatDate(form.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        
        <div className="flex items-center gap-1">
          <Link
            href={`/form/${form.slug}`}
            target="_blank"
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="ดูฟอร์ม"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/qr-codes?form=${form.id}`}
            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
            title="สร้าง QR Code"
          >
            <QrCode className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/forms/${form.id}`}
            onClick={() => console.log('🔗 Click Edit - Form ID:', form.id, 'URL:', `/admin/forms/${form.id}`)}
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
            title="แก้ไข"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="ลบ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
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

import { cn } from '@/lib/utils';
