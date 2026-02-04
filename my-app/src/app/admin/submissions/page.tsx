'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase';
import { Form } from '@/types';
import { 
  ArrowLeft, 
  FileText, 
  BarChart3, 
  ChevronRight,
  RefreshCw,
  Eye
} from 'lucide-react';

interface FormWithCount extends Form {
  submission_count: number;
}

export default function SubmissionsListPage() {
  const [forms, setForms] = useState<FormWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      
      // Get all forms
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('id, code, title, current_version, status, is_active')
        .order('created_at', { ascending: false });
      
      if (formsError) throw formsError;
      
      // Get submission counts
      const { data: countsData, error: countsError } = await supabase
        .from('submissions')
        .select('form_id');
      
      if (countsError) throw countsError;
      
      // Count submissions per form
      const countMap = new Map<string, number>();
      countsData?.forEach((sub: { form_id: string }) => {
        countMap.set(sub.form_id, (countMap.get(sub.form_id) || 0) + 1);
      });
      
      // Combine data
      const formsWithCount = (formsData || []).map((form: Form) => ({
        ...form,
        submission_count: countMap.get(form.id) || 0
      }));
      
      setForms(formsWithCount);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">คำตอบแบบสอบถาม</h1>
            <p className="text-slate-500">เลือกแบบสอบถามเพื่อดูรายละเอียดคำตอบ</p>
          </div>
        </div>
        <button 
          onClick={fetchData}
          className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
          title="รีเฟรช"
        >
          <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Forms List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">ไม่มีแบบสอบถาม</h3>
          <p className="text-slate-500">สร้างแบบสอบถามก่อนเพื่อรับคำตอบ</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">รหัส</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ชื่อแบบสอบถาม</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Version</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">คำตอบ</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">สถานะ</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forms.map((form) => (
                  <tr key={form.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-600">{form.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{form.title}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        v{form.current_version || 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-700">
                          {form.submission_count.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {form.status === 'published' && form.is_active && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">เปิดใช้งาน</span>
                      )}
                      {form.status === 'published' && !form.is_active && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">ปิดใช้งาน</span>
                      )}
                      {form.status === 'draft' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Draft</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/submissions/${form.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        ดูคำตอบ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
