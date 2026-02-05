'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';
import { Submission, Form, FormField } from '@/types';
import { 
  ArrowLeft, 
  Download, 
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getVersionBadgeStyle, getVersionColor } from '@/lib/versionColors';

const ITEMS_PER_PAGE = 50;

interface UnifiedField {
  key: string;
  label: string;
  version: number;
}

export default function FormSubmissionsPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Compute unified fields from form.fields
  const unifiedFields = useMemo(() => {
    if (!form?.fields?.length) return [];
    
    return form.fields.map((field: FormField) => ({
      key: field.id,
      label: field.label,
      // ใช้ _versionAdded ถ้ามี (คำถามใหม่), ไม่มีใช้ current_version
      version: field._versionAdded || form.current_version || 1,
    }));
  }, [form]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      
      // Get form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (formError) {
        console.error('❌ Form error:', formError);
      } else {
        setForm(formData as Form);
      }
      
      // Get submissions with QR Code + Project info
      let query = supabase
        .from('submissions')
        .select(`
          *,
          qr_code:qr_codes(id, name, utm_source, utm_medium, utm_campaign, utm_content, project_id),
          project:projects(id, code, name)
        `, { count: 'exact' })
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('submitted_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('submitted_at', dateTo + 'T23:59:59');
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, count, error } = await query.range(from, to);
      
      if (error) throw error;
      
      setSubmissions(data as Submission[] || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [formId, dateFrom, dateTo, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleExport = () => {
    if (!submissions.length) return;
    
    const headers = [
      'ID',
      'เวลาส่ง',
      'Version',
      ...unifiedFields.map(f => f.label)
    ];
    
    const rows = submissions.map(sub => {
      const row = [
        sub.id,
        formatDate(sub.submitted_at, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        `v${sub.form_version || 1}`,
      ];
      
      unifiedFields.forEach(field => {
        const value = (sub.responses as Record<string, unknown>)?.[field.key];
        if (value === undefined || value === null || value === '') {
          row.push('-');
        } else if (Array.isArray(value)) {
          row.push(value.join(', '));
        } else {
          row.push(String(value));
        }
      });
      
      return row;
    });
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${form?.code || 'submissions'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getFieldDisplayValue = (submission: Submission, field: UnifiedField): string => {
    const value = (submission.responses as Record<string, unknown>)?.[field.key];
    if (value === undefined || value === null || value === '') return '-';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  return (
    <div className="fixed inset-0 lg:left-64 top-0 bottom-0 right-0 overflow-auto p-4 lg:p-6 bg-slate-50">
      <div className="flex flex-col h-full gap-4 min-w-[800px]">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/admin/submissions" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {form?.title || 'รายละเอียดคำตอบ'}
              </h1>
              <p className="text-slate-500">
                {form?.code} • {totalCount.toLocaleString()} คำตอบ • v{form?.current_version || 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'border border-slate-200 hover:bg-slate-50 bg-white'
              }`}
            >
              <Calendar className="w-5 h-5" />
              ช่วงวันที่
            </button>
            <button 
              onClick={handleExport}
              disabled={!submissions.length}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-44">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ตั้งแต่</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-44">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ถึง</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  ล้าง
                </button>
                <button
                  onClick={fetchData}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">ไม่พบคำตอบ</h3>
                <p className="text-slate-500">ลองเปลี่ยนช่วงวันที่ดู</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap bg-slate-50">ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap bg-slate-50">เวลาส่ง</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700 whitespace-nowrap bg-slate-50">Version</th>
                      {unifiedFields.map((field) => {
                        const fieldColor = getVersionColor(field.version);
                        return (
                          <th 
                            key={field.key} 
                            className="px-4 py-3 text-left font-semibold whitespace-nowrap bg-slate-50 text-slate-700"
                            style={fieldColor ? { color: fieldColor } : undefined}
                          >
                            <div className="max-w-[200px] truncate flex items-center gap-1" title={`${field.label}${field.version > 1 ? ` (เพิ่ม v${field.version})` : ''}`}>
                              {field.label}
                              {field.version > 1 && (
                                <span className="text-xs opacity-60 ml-1" style={fieldColor ? { color: fieldColor } : undefined}>v{field.version}</span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                      {/* QR Code & UTM Columns - อยู่ท้ายตาราง */}
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap bg-slate-50">QR Code</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap bg-slate-50">รหัสโครงการ</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap bg-slate-50">ชื่อโครงการ</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap bg-slate-50">UTM Source</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap bg-slate-50">UTM Medium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                          #{sub.id?.slice(-6)}
                        </td>
                        <td className="px-4 py-3 text-slate-900 whitespace-nowrap">
                          {formatDate(sub.submitted_at, { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span 
                            className="inline-flex px-2 py-0.5 text-xs font-medium rounded border"
                            style={getVersionBadgeStyle(sub.form_version || 1)}
                          >
                            v{sub.form_version || 1}
                          </span>
                        </td>
                        {unifiedFields.map((field) => {
                          const value = getFieldDisplayValue(sub, field);
                          return (
                            <td 
                              key={field.key} 
                              className="px-4 py-3 max-w-[200px] truncate text-slate-700"
                              title={value !== '-' ? value : undefined}
                            >
                              {value}
                            </td>
                          );
                        })}
                        {/* QR Code & UTM Columns - อยู่ท้ายตาราง */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {sub.qr_code?.name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">
                          {sub.project?.code || sub.qr_code?.project_id || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {sub.project?.name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {sub.qr_code?.utm_source ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              {sub.qr_code.utm_source}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {sub.qr_code?.utm_medium ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              {sub.qr_code.utm_medium}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white flex-shrink-0">
                <div className="text-sm text-slate-600">
                  แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} จาก {totalCount.toLocaleString()} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium">
                    หน้า {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
