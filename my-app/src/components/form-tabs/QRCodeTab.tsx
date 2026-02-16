'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCode } from '@/types';
import { 
  QrCode, 
  ExternalLink, 
  Download, 
  BarChart3, 
  Calendar,
  Plus,
  Copy,
  CheckCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface QRCodeTabProps {
  formId: string;
  formCode: string;
}

interface QRCodeWithProject extends QRCode {
  project?: { id: string; name: string } | null;
}

export function QRCodeTab({ formId, formCode }: QRCodeTabProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchQRCodes();
  }, [formId]);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forms/${formId}/qr-codes`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch QR codes');
      }
      
      setQrCodes(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getQRCodeUrl = (qrSlug: string) => {
    return `${window.location.origin}/qr/${qrSlug}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">เกิดข้อผิดพลาด</h3>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">QR Codes ของแบบสอบถามนี้</h2>
          <p className="text-sm text-slate-500 mt-1">
            มี {qrCodes.length} QR Code{qrCodes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href={`/admin/qr-codes/create?formId=${formId}`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          สร้าง QR Code ใหม่
        </Link>
      </div>

      {/* QR Codes Grid */}
      {qrCodes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">ยังไม่มี QR Code</h3>
          <p className="text-slate-500 mb-6">สร้าง QR Code เพื่อให้ผู้ใช้สแกนเข้าถึงแบบสอบถามนี้</p>
          <Link
            href={`/admin/qr-codes/create?formId=${formId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            สร้าง QR Code
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {qrCodes.map((qr) => (
            <div
              key={qr.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="flex gap-5">
                {/* QR Code Image */}
                <div className="flex-shrink-0">
                  {qr.qr_image_url ? (
                    <img
                      src={qr.qr_image_url}
                      alt={qr.name}
                      className="w-28 h-28 object-contain border border-slate-200 rounded-xl"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                      <QrCode className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-lg mb-1 truncate" title={qr.name}>
                    {qr.name}
                  </h3>
                  
                  {/* UTM Info */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {qr.utm_source && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                        source: {qr.utm_source}
                      </span>
                    )}
                    {qr.utm_medium && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
                        medium: {qr.utm_medium}
                      </span>
                    )}
                    {qr.utm_campaign && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                        campaign: {qr.utm_campaign}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4" />
                      <span>{qr.scan_count.toLocaleString()} สแกน</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(qr.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Project */}
                  {qr.project && (
                    <div className="text-sm text-slate-500 mb-3">
                      โครงการ: <span className="text-slate-700">{qr.project.name}</span>
                    </div>
                  )}

                  {/* URL & Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={getQRCodeUrl(qr.qr_slug)}
                        readOnly
                        className="w-full px-3 py-1.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                      />
                      <button
                        onClick={() => copyToClipboard(getQRCodeUrl(qr.qr_slug), qr.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="คัดลอก URL"
                      >
                        {copiedId === qr.id ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <a
                  href={qr.qr_image_url || '#'}
                  download={`${qr.qr_slug}.png`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลด
                </a>
                <Link
                  href={`/admin/qr-codes/${qr.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  แก้ไข
                </Link>
                <Link
                  href={`/admin/qr-codes/${qr.id}/stats`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  สถิติ
                </Link>
                <a
                  href={`/qr/${qr.qr_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  ทดสอบ
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
