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
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface QRCodeTabProps {
  formId: string;
  formCode: string;
}

export function QRCodeTab({ formId, formCode }: QRCodeTabProps) {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
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

  const getQRImageUrl = (qrSlug: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/qr/${qrSlug}`)}`;
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
    <div className="space-y-6 pt-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">QR Codes</h2>
          <p className="text-sm text-slate-500 mt-1">
            มี {qrCodes.length} QR Code
          </p>
        </div>
        <Link
          href={`/admin/qr-codes?form=${formId}&action=create`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          สร้าง QR Code ใหม่
        </Link>
      </div>

      {/* QR Codes List */}
      {qrCodes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">ยังไม่มี QR Code</h3>
          <p className="text-slate-500 mb-6">สร้าง QR Code เพื่อให้ผู้ใช้สแกนเข้าถึงแบบสอบถามนี้</p>
          <Link
            href={`/admin/qr-codes/create?formId=${formId}` as any}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            สร้าง QR Code
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* List Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
            <div className="col-span-1">QR</div>
            <div className="col-span-4">ชื่อ</div>
            <div className="col-span-2">UTM</div>
            <div className="col-span-2">สถิติ</div>
            <div className="col-span-3 text-right">จัดการ</div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-slate-100">
            {qrCodes.map((qr) => (
              <div
                key={qr.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors"
              >
                {/* QR Image */}
                <div className="col-span-1 flex md:block items-center gap-4 md:gap-0">
                  <img
                    src={getQRImageUrl(qr.qr_slug)}
                    alt={qr.name}
                    className="w-16 h-16 md:w-12 md:h-12 object-contain border border-slate-200 rounded-lg"
                  />
                  <span className="md:hidden font-medium text-slate-900">{qr.name}</span>
                </div>

                {/* Name & URL */}
                <div className="col-span-4 hidden md:block">
                  <h3 className="font-medium text-slate-900 mb-1" title={qr.name}>
                    {qr.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={getQRCodeUrl(qr.qr_slug)}
                      readOnly
                      className="flex-1 min-w-0 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500"
                    />
                    <button
                      onClick={() => copyToClipboard(getQRCodeUrl(qr.qr_slug), qr.id)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
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

                {/* UTM Tags */}
                <div className="col-span-2 flex flex-wrap gap-1">
                  {qr.utm_source && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                      {qr.utm_source}
                    </span>
                  )}
                  {qr.utm_medium && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
                      {qr.utm_medium}
                    </span>
                  )}
                  {qr.utm_campaign && (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                      {qr.utm_campaign}
                    </span>
                  )}
                  {!qr.utm_source && !qr.utm_medium && !qr.utm_campaign && (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </div>

                {/* Stats */}
                <div className="col-span-2 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <BarChart3 className="w-4 h-4" />
                    <span>{qr.scan_count.toLocaleString()} สแกน</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(qr.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-3 flex items-center justify-end gap-1">
                  <a
                    href={getQRImageUrl(qr.qr_slug)}
                    download={`${qr.qr_slug}.png`}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="ดาวน์โหลด"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <Link
                    href={`/admin/qr-codes/${qr.id}` as any}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/admin/qr-codes/${qr.id}/stats` as any}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="สถิติ"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Link>
                  <a
                    href={`/qr/${qr.qr_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="ทดสอบ"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
