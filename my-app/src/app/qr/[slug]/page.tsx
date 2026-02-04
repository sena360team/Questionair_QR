'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';
import { storeUTMInSession } from '@/lib/utm';
import { QRCode } from '@/types';

export default function QRRedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const qrSlug = params.slug as string;
  
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQRCode] = useState<QRCode | null>(null);

  useEffect(() => {
    async function handleRedirect() {
      try {
        const supabase = getSupabaseBrowser();
        
        // 1. ดึงข้อมูล QR Code
        const { data: qrData, error: qrError } = await supabase
          .from('qr_codes')
          .select('*')
          .eq('qr_slug', qrSlug)
          .single();
          
        if (qrError || !qrData) {
          setError('QR Code นี้ไม่มีในระบบ');
          setStatus('error');
          return;
        }
        
        setQRCode(qrData as QRCode);
        
        // 2. ดึงข้อมูลฟอร์มเพื่อตรวจสอบ is_active
        const { data: formData, error: formError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', qrData.form_id)
          .single();
          
        if (formError || !formData || !formData.is_active) {
          setError('แบบสอบถามนี้ถูกปิดใช้งานชั่วคราว');
          setStatus('error');
          return;
        }
        
        // 3. บันทึกการสแกน
        await supabase.rpc('record_qr_scan', { qr_slug_param: qrSlug });
        
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
        
        const targetUrl = qrData.redirect_url 
          ? qrData.redirect_url
          : `/form/${formData.slug}`;
          
        // รอสักครู่แล้ว redirect
        setTimeout(() => {
          router.push(targetUrl);
        }, 500);
        
      } catch (err) {
        console.error('QR redirect error:', err);
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
        setStatus('error');
      }
    }
    
    if (qrSlug) {
      handleRedirect();
    }
  }, [qrSlug, searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900">กำลังโหลด...</h1>
            <p className="text-slate-500">กรุณารอสักครู่</p>
          </>
        )}
        
        {status === 'redirecting' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">กำลังพาไปยังแบบสอบถาม</h1>
            {qrCode && (
              <p className="text-slate-500 mt-2">{qrCode.name}</p>
            )}
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">ไม่สามารถเข้าถึงได้</h1>
            <p className="text-slate-500 mt-2">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
