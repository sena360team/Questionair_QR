'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { storeUTMInSession } from '@/lib/utm';
import { QRCode } from '@/types';
import FormInactiveState from '@/components/FormInactiveState';

// ============================================================
// QR Redirect Page — แทนที่ Supabase ด้วย fetch API
// ============================================================

function QRRedirectPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrSlug = params.slug as string;

  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    async function handleRedirect() {
      try {
        // 1. ดึงข้อมูล QR Code ผ่าน API
        const qrRes = await fetch(`/api/qr-codes/${qrSlug}`);
        if (!qrRes.ok) {
          setError('QR Code นี้ไม่มีในระบบ');
          setStatus('error');
          return;
        }
        const qrData: QRCode & { form?: any } = await qrRes.json();

        // 2. ตรวจสอบว่า form active หรือไม่
        const formRes = await fetch(`/api/forms/${qrData.form_id}`);
        if (!formRes.ok) { setIsInactive(true); return; }
        const formData = await formRes.json();
        if (!formData.is_active) { setIsInactive(true); return; }

        // 3. บันทึกการสแกน QR
        fetch(`/api/qr-codes/${qrData.id}/scan`, { method: 'POST' }).catch(() => { });

        // 4. เก็บ UTM parameters ลง sessionStorage
        const utmParams = {
          utm_source: searchParams.get('utm_source') || qrData.utm_source || 'qr_code',
          utm_medium: searchParams.get('utm_medium') || qrData.utm_medium || 'offline',
          utm_campaign: searchParams.get('utm_campaign') || qrData.utm_campaign || undefined,
          utm_content: searchParams.get('utm_content') || qrData.utm_content || undefined,
          utm_term: searchParams.get('utm_term') || qrData.utm_term || undefined,
        };
        storeUTMInSession(utmParams);

        // 5. Redirect ไปยังฟอร์ม
        setStatus('redirecting');
        const baseUrl = qrData.redirect_url || `/form/${formData.slug}`;
        const separator = baseUrl.includes('?') ? '&' : '?';
        const targetUrl = `${baseUrl}${separator}_qr=${qrSlug}`;

        setTimeout(() => { router.push(targetUrl as any); }, 500);
      } catch (err) {
        console.error('QR redirect error:', err);
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
        setStatus('error');
      }
    }

    if (qrSlug) handleRedirect();
  }, [qrSlug, searchParams, router]);

  if (isInactive) return <FormInactiveState />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-600">กำลังโหลด QR Code...</p>
          </>
        )}
        {status === 'redirecting' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-600">กำลังนำทางไปยังแบบสอบถาม...</p>
          </>
        )}
        {status === 'error' && (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h1>
            <p className="text-slate-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QRRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <QRRedirectPageContent />
    </Suspense>
  );
}
