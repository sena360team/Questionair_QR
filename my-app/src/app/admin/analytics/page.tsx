'use client';

import { useMemo, useState } from 'react';
import { useSubmissions, useQRCodes, useForms } from '@/hooks/useSupabase';
import { 
  BarChart3, 
  Calendar, 
  MapPin, 
  QrCode,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';
import { formatDate, formatNumber, groupBy } from '@/lib/utils';

// Simple bar chart component (ไม่ต้องใช้ recharts)
function SimpleBarChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-4">
          <span className="text-sm text-slate-600 w-20 truncate">{item.label}</span>
          <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-lg transition-all duration-500"
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-900 w-10 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { submissions, loading: subLoading } = useSubmissions();
  const { qrCodes, loading: qrLoading } = useQRCodes();
  const { forms, loading: formsLoading } = useForms();
  const [dateRange, setDateRange] = useState('7days');

  const loading = subLoading || qrLoading || formsLoading;

  const stats = useMemo(() => {
    const totalSubmissions = submissions.length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0);
    
    // Filter by date range
    const now = new Date();
    let daysBack = 7;
    if (dateRange === '30days') daysBack = 30;
    if (dateRange === '90days') daysBack = 90;
    
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const filteredSubmissions = submissions.filter(s => 
      new Date(s.submitted_at) >= cutoffDate
    );

    // Group by date
    const submissionsByDate = Array.from({ length: Math.min(daysBack, 14) }, (_, i) => {
      const d = new Date(now.getTime() - (Math.min(daysBack, 14) - 1 - i) * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      return {
        label: d.toLocaleDateString('th-TH', { weekday: 'short' }),
        value: filteredSubmissions.filter(s => s.submitted_at.startsWith(dateStr)).length
      };
    });

    // UTM Source stats
    const sourceStats = Object.entries(groupBy(filteredSubmissions, 'utm_source'))
      .map(([source, items]) => ({ label: source || 'Direct', value: items.length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // UTM Content (location) stats
    const locationStats = Object.entries(groupBy(
      filteredSubmissions.filter(s => s.utm_content), 
      'utm_content'
    ))
      .map(([content, items]) => ({ label: content, value: items.length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // QR Performance
    const qrStats = qrCodes
      .map(qr => ({
        name: qr.name,
        scans: qr.scan_count,
        submissions: submissions.filter(s => s.qr_code_id === qr.id).length
      }))
      .sort((a, b) => b.submissions - a.submissions)
      .slice(0, 5);

    return {
      totalSubmissions,
      totalScans,
      conversionRate: totalScans > 0 ? Math.round((totalSubmissions / totalScans) * 100) : 0,
      submissionsByDate,
      sourceStats,
      locationStats,
      qrStats,
      filteredCount: filteredSubmissions.length
    };
  }, [submissions, qrCodes, dateRange]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายงานและ Analytics</h1>
          <p className="text-slate-500">วิเคราะห์ข้อมูลจากแบบสอบถามและ QR Codes</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
          {[
            { value: '7days', label: '7 วัน' },
            { value: '30days', label: '30 วัน' },
            { value: '90days', label: '90 วัน' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === option.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="คำตอบในช่วง"
          value={stats.filteredCount}
          color="blue"
        />
        <StatCard
          icon={<QrCode className="w-6 h-6" />}
          label="ยอดสแกนรวม"
          value={stats.totalScans}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          color="purple"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="คำตอบทั้งหมด"
          value={stats.totalSubmissions}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submissions Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">แนวโน้มคำตอบ</h3>
            <span className="text-sm text-slate-500">{dateRange === '7days' ? '7 วัน' : dateRange === '30days' ? '30 วัน' : '90 วัน'} ล่าสุด</span>
          </div>
          <SimpleBarChart 
            data={stats.submissionsByDate} 
            maxValue={Math.max(...stats.submissionsByDate.map(d => d.value), 1)} 
          />
        </div>

        {/* UTM Source */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">แหล่งที่มา (UTM Source)</h3>
          </div>
          {stats.sourceStats.length > 0 ? (
            <SimpleBarChart 
              data={stats.sourceStats} 
              maxValue={Math.max(...stats.sourceStats.map(d => d.value), 1)} 
            />
          ) : (
            <p className="text-center text-slate-500 py-8">ไม่มีข้อมูล</p>
          )}
        </div>

        {/* Location Stats */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              คำตอบตามตำแหน่ง
            </h3>
          </div>
          {stats.locationStats.length > 0 ? (
            <SimpleBarChart 
              data={stats.locationStats} 
              maxValue={Math.max(...stats.locationStats.map(d => d.value), 1)} 
            />
          ) : (
            <p className="text-center text-slate-500 py-8">ไม่มีข้อมูล</p>
          )}
        </div>

        {/* QR Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">ประสิทธิภาพ QR Code</h3>
          </div>
          <div className="space-y-4">
            {stats.qrStats.map((qr) => (
              <div key={qr.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">{qr.name}</p>
                  <p className="text-sm text-slate-500">{qr.scans} สแกน</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{qr.submissions}</p>
                  <p className="text-xs text-slate-500">คำตอบ</p>
                </div>
              </div>
            ))}
            {stats.qrStats.length === 0 && (
              <p className="text-center text-slate-500 py-8">ไม่มีข้อมูล</p>
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
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
