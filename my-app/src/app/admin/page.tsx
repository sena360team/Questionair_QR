'use client';

import Link from 'next/link';
import { useForms, useQRCodes, useSubmissions } from '@/hooks/useSupabase';
import {
  FileText,
  QrCode,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { forms, loading: formsLoading } = useForms();
  const { qrCodes, loading: qrLoading } = useQRCodes();
  const { submissions, loading: subLoading } = useSubmissions();

  const loading = formsLoading || qrLoading || subLoading;

  // Calculate stats
  const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0);
  const todaySubmissions = submissions.filter(s => {
    const today = new Date().toISOString().split('T')[0];
    return s.submitted_at.startsWith(today);
  }).length;

  // Calculate trends (this month vs last month)
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const thisMonthForms = forms.filter(f => {
    const date = new Date(f.created_at);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;

  const lastMonthForms = forms.filter(f => {
    const date = new Date(f.created_at);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  }).length;

  const formTrend = thisMonthForms - lastMonthForms;

  const thisMonthSubmissions = submissions.filter(s => {
    const date = new Date(s.submitted_at);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;

  const lastMonthSubmissions = submissions.filter(s => {
    const date = new Date(s.submitted_at);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  }).length;

  const submissionTrend = thisMonthSubmissions - lastMonthSubmissions;

  // Recent activity
  const recentSubmissions = submissions.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">แดชบอร์ด</h1>
        <p className="text-slate-500">ภาพรวมระบบแบบสอบถามของคุณ</p>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={<FileText className="w-6 h-6" />}
          label="แบบสอบถาม"
          value={forms.length}
          trend={formTrend !== 0 ? `${formTrend > 0 ? '+' : ''}${formTrend} จากเดือนที่แล้ว` : 'เท่ากับเดือนที่แล้ว'}
          trendUp={formTrend >= 0}
          href="/admin/forms"
        />
        <StatCard
          icon={<QrCode className="w-6 h-6" />}
          label="QR Codes"
          value={qrCodes.length}
          trend={`${totalScans.toLocaleString()} การสแกน`}
          href="/admin/qr-codes"
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="คำตอบทั้งหมด"
          value={submissions.length}
          trend={submissionTrend !== 0 ? `${submissionTrend > 0 ? '+' : ''}${submissionTrend} จากเดือนที่แล้ว` : 'เท่ากับเดือนที่แล้ว'}
          trendUp={submissionTrend >= 0}
          href="/admin/submissions"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="คำตอบวันนี้"
          value={todaySubmissions}
          trend="วันนี้"
          highlight={true}
        />
      </div>

      {/* Main Content Grid - Wide Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
        {/* Recent Forms - Takes 2/3 on xl, 3/4 on 2xl */}
        <div className="xl:col-span-2 2xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">แบบสอบถามล่าสุด</h2>
            <Link
              href="/admin/forms"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden">
            {forms.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มีแบบสอบถาม</p>
                <Link
                  href="/admin/forms/create"
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                >
                  สร้างแบบสอบถามแรก
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {forms.slice(0, 10).map((form) => (
                  <div
                    key={form.id}
                    className="p-4 lg:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">{form.title}</h3>
                        <p className="text-sm text-slate-500">
                          {form.fields?.length || 0} คำถาม • สร้างเมื่อ {formatDate(form.created_at, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 lg:gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-2xl font-bold text-slate-900">
                          {submissions.filter(s => s.form_id === form.id).length}
                        </p>
                        <p className="text-xs text-slate-500">คำตอบ</p>
                      </div>
                      <Link
                        href={`/admin/forms/${form.id}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity - Takes 1/3 on xl, 1/4 on 2xl */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">กิจกรรมล่าสุด</h2>

          <div className="bg-white rounded-2xl border-2 border-slate-300 p-6">
            {recentSubmissions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">ยังไม่มีกิจกรรม</p>
            ) : (
              <div className="space-y-6">
                {recentSubmissions.map((sub) => {
                  const form = forms.find(f => f.id === sub.form_id);
                  return (
                    <div key={sub.id} className="flex gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          มีคำตอบใหม่
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {form?.title || 'แบบสอบถาม'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(sub.submitted_at, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Components ====================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: string;
  trendUp?: boolean;
  href?: string;
  highlight?: boolean;
}

function StatCard({ icon, label, value, trend, trendUp, href, highlight }: StatCardProps) {
  const content = (
    <div className={cn(
      "p-4 lg:p-6 rounded-2xl transition-all h-full",
      highlight
        ? "bg-blue-600 text-white"
        : "bg-white border-2 border-slate-300 hover:border-blue-300 hover:shadow-lg"
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          highlight ? "bg-blue-500 text-white" : "bg-slate-50 text-slate-600"
        )}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-xs flex items-center gap-1 flex-shrink-0",
            highlight ? "text-blue-100" : "text-slate-500"
          )}>
            {trendUp !== undefined && (
              trendUp
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
            )}
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={cn(
          "text-2xl lg:text-3xl font-bold",
          highlight ? "text-white" : "text-slate-900"
        )}>
          {formatNumber(value)}
        </p>
        <p className={cn(
          "text-sm mt-1",
          highlight ? "text-blue-100" : "text-slate-500"
        )}>
          {label}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href as any} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
