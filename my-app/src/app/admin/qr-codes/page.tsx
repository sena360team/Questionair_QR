'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useQRCodes, useForms, useSubmissions, useProjects } from '@/hooks/useSupabase';
import { QRGenerator } from '@/components/QRGenerator';
import { generateQRCodeDataURL, buildQRRedirectURL } from '@/lib/qr';
import { 
  QrCode, 
  Plus, 
  Search, 
  ExternalLink,
  Download,
  Trash2,
  BarChart3,
  MapPin,
  FileText,
  ChevronRight,
  X
} from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { QRCode as QRCodeType } from '@/types';

export default function QRCodesPage() {
  const searchParams = useSearchParams();
  const formFilterFromUrl = searchParams.get('form');
  
  const { qrCodes, loading, deleteQRCode, createQRCode } = useQRCodes();
  const { forms } = useForms();
  const { projects } = useProjects();
  const { submissions } = useSubmissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string>('');
  
  // Filters
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>(formFilterFromUrl || '');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('');

  const filteredQRCodes = qrCodes.filter(qr => {
    // Search term filter
    const matchesSearch = qr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.qr_slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Form filter
    const matchesForm = !selectedFormFilter || qr.form_id === selectedFormFilter;
    
    // Project filter
    const matchesProject = !selectedProjectFilter || qr.project_id === selectedProjectFilter;
    
    return matchesSearch && matchesForm && matchesProject;
  });
  
  // Update URL filter when changed
  useEffect(() => {
    if (formFilterFromUrl) {
      setSelectedFormFilter(formFilterFromUrl);
    }
  }, [formFilterFromUrl]);
  
  // Clear filters
  const clearFilters = () => {
    setSelectedFormFilter('');
    setSelectedProjectFilter('');
    setSearchTerm('');
  };
  
  const hasActiveFilters = selectedFormFilter || selectedProjectFilter || searchTerm;

  // Check for duplicate QR slug
  const checkDuplicateQR = useCallback((qr_slug: string): boolean => {
    return qrCodes.some(qr => qr.qr_slug.toLowerCase() === qr_slug.toLowerCase());
  }, [qrCodes]);

  const handleCreate = async (qrData: {
    name: string;
    qr_slug: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  }) => {
    if (!selectedForm) return;
    
    // Check for duplicate
    if (checkDuplicateQR(qrData.qr_slug)) {
      if (!confirm(`รหัส QR "${qrData.qr_slug}" มีในระบบแล้ว\n\nต้องการสร้างซ้ำหรือไม่?`)) {
        return;
      }
    }
    
    await createQRCode({
      form_id: selectedForm,
      ...qrData,
    });
    
    setShowCreateModal(false);
    setSelectedForm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QR Codes</h1>
          <p className="text-slate-500">จัดการ QR Codes สำหรับแบบสอบถาม</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          สร้าง QR Code
        </button>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white p-5 lg:p-6 rounded-2xl border-2 border-slate-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <QrCode className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{qrCodes.length}</p>
              <p className="text-sm text-slate-500">QR Codes ทั้งหมด</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 lg:p-6 rounded-2xl border-2 border-slate-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">
                {formatNumber(qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0))}
              </p>
              <p className="text-sm text-slate-500">ยอดสแกนรวม</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 lg:p-6 rounded-2xl border-2 border-slate-300 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">
                {submissions.filter(s => s.qr_code_id).length}
              </p>
              <p className="text-sm text-slate-500">คำตอบจาก QR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Always Visible */}
      <div className="bg-white p-4 rounded-xl border-2 border-slate-300 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหา QR Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Filter Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Form Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">แบบสอบถาม</label>
            <select
              value={selectedFormFilter}
              onChange={(e) => setSelectedFormFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title}
                </option>
              ))}
            </select>
          </div>
          
          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">โครงการ</label>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              {selectedFormFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200">
                  แบบสอบถาม: {forms.find(f => f.id === selectedFormFilter)?.title || selectedFormFilter}
                </span>
              )}
              {selectedProjectFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-lg border border-purple-200">
                  โครงการ: {projects?.find(p => p.id === selectedProjectFilter)?.name || selectedProjectFilter}
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-lg border border-slate-200">
                  ค้นหา: {searchTerm}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>

      {/* QR Codes List - Full Width Table */}
      {filteredQRCodes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-slate-300">
          <QrCode className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchTerm ? 'ไม่พบ QR Code' : 'ยังไม่มี QR Code'}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'สร้าง QR Code แรกของคุณ'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              สร้าง QR Code
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-300">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-slate-600">QR Code</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-600">แบบสอบถาม</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-600">โครงการ</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-600">รหัสโครงการ</th>
                  <th className="text-center py-4 px-6 font-medium text-slate-600 w-20">สแกน</th>
                  <th className="text-center py-4 px-6 font-medium text-slate-600 w-20">คำตอบ</th>
                  <th className="text-right py-4 px-6 font-medium text-slate-600 w-28">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredQRCodes.map((qr) => (
                  <QRCodeRow
                    key={qr.id}
                    qr={qr}
                    form={forms.find(f => f.id === qr.form_id)}
                    project={projects?.find(p => p.id === qr.project_id)}
                    submissionCount={submissions.filter(s => s.qr_code_id === qr.id).length}
                    onDelete={() => deleteQRCode(qr.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto p-6 lg:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">สร้าง QR Code ใหม่</h2>
            
            {!selectedForm ? (
              <div className="space-y-4">
                <p className="text-slate-600">เลือกแบบสอบถามที่ต้องการสร้าง QR Code:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forms
                    .filter((form) => form.status === 'published')
                    .map((form) => (
                      <button
                        key={form.id}
                        onClick={() => setSelectedForm(form.id)}
                        className="p-4 border-2 border-slate-300 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{form.title}</p>
                            <p className="text-sm text-slate-500 truncate">/{form.slug}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
                {forms.filter((f) => f.status === 'published').length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">ไม่มีแบบสอบถามที่เผยแพร่แล้ว</p>
                    <p className="text-sm text-slate-400 mt-1">
                      กรุณา Publish แบบสอบถามก่อนสร้าง QR Code
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-3 border-2 border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setSelectedForm('')}
                  className="mb-4 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  กลับไปเลือกแบบสอบถาม
                </button>
                <QRGenerator
                  formSlug={forms.find(f => f.id === selectedForm)?.slug || ''}
                  formId={selectedForm}
                  existingQRCodes={qrCodes}
                  onSave={handleCreate}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Components ====================

interface QRCodeRowProps {
  qr: QRCodeType;
  form?: { title: string; slug: string };
  project?: { name: string; code: string };
  submissionCount: number;
  onDelete: () => void;
}

// Helper function to format project code
function formatProjectCode(code: string | undefined): string {
  if (!code) return '-';
  return code.length > 10 ? code.substring(0, 10) + '...' : code;
}

function QRCodeRow({ qr, form, project, submissionCount, onDelete }: QRCodeRowProps) {
  const [showQR, setShowQR] = useState(false);
  const [qrImage, setQrImage] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // Generate QR Code เมื่อเปิด modal
  useEffect(() => {
    if (showQR && !qrImage) {
      generateQR();
    }
  }, [showQR]);

  const generateQR = useCallback(async () => {
    setGenerating(true);
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = buildQRRedirectURL(baseUrl, qr.qr_slug, {
        utm_source: qr.utm_source || undefined,
        utm_medium: qr.utm_medium || undefined,
        utm_campaign: qr.utm_campaign || undefined,
        utm_content: qr.utm_content || undefined,
      });
      const dataUrl = await generateQRCodeDataURL(url, { width: 400 });
      setQrImage(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR:', error);
    } finally {
      setGenerating(false);
    }
  }, [qr]);

  const handleDownload = () => {
    if (qrImage) {
      const link = document.createElement('a');
      link.href = qrImage;
      link.download = `qr-${qr.qr_slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
        <td className="py-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate max-w-[150px]" title={qr.name}>{qr.name}</p>
              {qr.utm_content && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                  <MapPin className="w-3 h-3" />
                  {qr.utm_content}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="py-4 px-6">
          <div className="group relative">
            <p className="text-slate-900 truncate max-w-[180px] cursor-help">
              {form?.title || 'ไม่พบแบบสอบถาม'}
            </p>
            {form?.title && form.title.length > 25 && (
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap max-w-[300px]">
                  <p className="font-medium">{form.title}</p>
                  <p className="text-slate-300 text-xs mt-1">Slug: {form.slug}</p>
                </div>
                <div className="absolute left-4 top-full w-2 h-2 bg-slate-800 rotate-45 -mt-1"></div>
              </div>
            )}
          </div>
        </td>
        <td className="py-4 px-6">
          <div className="group relative">
            <p className="text-slate-600 text-sm truncate max-w-[120px] cursor-help">
              {project?.name || '-'}
            </p>
            {project?.name && project.name.length > 15 && (
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-slate-300 text-xs mt-1">รหัส: {project.code || '-'}</p>
                </div>
                <div className="absolute left-4 top-full w-2 h-2 bg-slate-800 rotate-45 -mt-1"></div>
              </div>
            )}
          </div>
        </td>
        <td className="py-4 px-6">
          <code className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded" title={project?.code}>
            {formatProjectCode(project?.code)}
          </code>
        </td>
        <td className="py-4 px-6 text-center">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            {formatNumber(qr.scan_count)}
          </span>
        </td>
        <td className="py-4 px-6 text-center">
          <span className="font-semibold text-slate-900">{submissionCount}</span>
        </td>
        <td className="py-4 px-6">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setShowQR(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="ดู QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <Link
              href={`/qr/${qr.qr_slug}`}
              target="_blank"
              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
              title="ทดสอบลิงก์"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="ลบ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* QR Preview Modal - Portal ออกนอก table */}
      {showQR && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <h3 className="font-semibold text-slate-900 mb-2">{qr.name}</h3>
            <p className="text-sm text-slate-500 mb-6">/{qr.qr_slug}</p>
            
            {/* QR Code Image */}
            <div className="w-56 h-56 bg-white rounded-xl mx-auto mb-6 flex items-center justify-center border-2 border-slate-300 p-2">
              {generating ? (
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
              ) : qrImage ? (
                <img src={qrImage} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-slate-300" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={!qrImage}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-5 h-5" />
                ดาวน์โหลด
              </button>
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
