'use client';

import { useMemo } from 'react';
import { Submission, QRCode } from '@/types';
import { formatDate, formatNumber, groupBy } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, QrCode, MousePointer, Calendar } from 'lucide-react';

interface AnalyticsProps {
  submissions: Submission[];
  qrCodes: QRCode[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function AnalyticsDashboard({ submissions, qrCodes }: AnalyticsProps) {
  const stats = useMemo(() => {
    const totalSubmissions = submissions.length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0);
    
    // Submissions by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    
    const submissionsByDate = last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('th-TH', { weekday: 'short' }),
      count: submissions.filter(s => s.submitted_at.startsWith(date)).length
    }));

    // UTM Source breakdown
    const utmSourceData = Object.entries(
      groupBy(submissions, 'utm_source')
    ).map(([source, items]) => ({
      name: source || 'Direct',
      value: items.length
    })).sort((a, b) => b.value - a.value).slice(0, 6);

    // UTM Content breakdown (for location tracking)
    const utmContentData = Object.entries(
      groupBy(submissions.filter(s => s.utm_content), 'utm_content')
    ).map(([content, items]) => ({
      name: content,
      value: items.length
    })).sort((a, b) => b.value - a.value).slice(0, 6);

    // Top QR Codes
    const qrPerformance = qrCodes
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
      utmSourceData,
      utmContentData,
      qrPerformance
    };
  }, [submissions, qrCodes]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="คำตอบทั้งหมด"
          value={formatNumber(stats.totalSubmissions)}
          color="blue"
        />
        <StatCard
          icon={<MousePointer className="w-6 h-6" />}
          label="สแกน QR Code"
          value={formatNumber(stats.totalScans)}
          color="green"
        />
        <StatCard
          icon={<QrCode className="w-6 h-6" />}
          label="จำนวน QR Code"
          value={formatNumber(qrCodes.length)}
          color="purple"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          color="amber"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions Trend */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-300">
          <h3 className="font-semibold text-slate-900 mb-4">แนวโน้มคำตอบ (7 วัน)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.submissionsByDate}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* UTM Source Distribution */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-300">
          <h3 className="font-semibold text-slate-900 mb-4">แหล่งที่มา (UTM Source)</h3>
          <div className="h-64">
            {stats.utmSourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.utmSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.utmSourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                ไม่มีข้อมูล
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {stats.utmSourceData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Code Performance */}
      <div className="bg-white p-6 rounded-xl border-2 border-slate-300">
        <h3 className="font-semibold text-slate-900 mb-4">ประสิทธิภาพ QR Code</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="text-left py-3 px-4 font-medium text-slate-700">ชื่อ QR Code</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">จำนวนสแกน</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">คำตอบ</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {stats.qrPerformance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    ยังไม่มีข้อมูล QR Code
                  </td>
                </tr>
              ) : (
                stats.qrPerformance.map((qr) => (
                  <tr className="border-b border-slate-200" key={qr.name} className="border-b border-slate-300">
                    <td className="py-3 px-4">{qr.name}</td>
                    <td className="text-center py-3 px-4">{formatNumber(qr.scans)}</td>
                    <td className="text-center py-3 px-4 font-medium">{formatNumber(qr.submissions)}</td>
                    <td className="text-center py-3 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        qr.submissions / qr.scans > 0.5 
                          ? "bg-green-100 text-green-700"
                          : qr.submissions / qr.scans > 0.2
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {qr.scans > 0 ? Math.round((qr.submissions / qr.scans) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location/Content Breakdown */}
      {stats.utmContentData.length > 0 && (
        <div className="bg-white p-6 rounded-xl border-2 border-slate-300">
          <h3 className="font-semibold text-slate-900 mb-4">คำตอบตามตำแหน่ง (UTM Content)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.utmContentData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12 }}
                  width={120}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Stat Card Component ====================

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-slate-300">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-lg", colorClasses[color])}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ต้อง install recharts ด้วย
// npm install recharts
import { cn } from '@/lib/utils';
