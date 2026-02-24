'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FormRenderer } from '@/components/FormRenderer';
import { getUTMParamsFromURL, getUTMFromSession, clearUTMSession, storeUTMInSession, hasUTMParams } from '@/lib/utm';
import { Form } from '@/types';
import { CheckCircle, XCircle } from 'lucide-react';
import FormInactiveState from '@/components/FormInactiveState';
import { sendToCSS } from '@/lib/css-api';

// ============================================================
// Form Page — แทนที่ Supabase ด้วย fetch API
// ============================================================

interface SubmitStatus {
  type: 'success' | 'error';
  message: string;
  show: boolean;
}

function FormPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = decodeURIComponent(params.slug as string);

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({ type: 'success', message: '', show: false });
  const [qrSlug, setQrSlug] = useState<string | null>(null);
  const [isInactive, setIsInactive] = useState(false);

  // ดึงข้อมูลฟอร์มและ UTM parameters
  useEffect(() => {
    async function loadForm() {
      try {
        // ดึงฟอร์มผ่าน API
        const res = await fetch(`/api/forms/${slug}`);
        if (!res.ok) {
          setError(`ไม่พบแบบสอบถาม: ${slug}`);
          return;
        }
        const data: Form = await res.json();

        if (data.status === 'archived') {
          setError('แบบสอบถามนี้ไม่สามารถใช้งานได้แล้ว');
          return;
        }

        if (data.status === 'published' && !data.is_active) {
          setIsInactive(true);
          return;
        }

        setForm(data);

        // ดึง QR slug จาก query param
        const qrSlugFromUrl = searchParams.get('_qr');
        if (qrSlugFromUrl) setQrSlug(qrSlugFromUrl);

        // ดึง UTM จาก URL หรือ session
        const urlParams = getUTMParamsFromURL();
        const sessionParams = hasUTMParams(urlParams) ? {} : getUTMFromSession();
        const mergedParams = { ...sessionParams, ...urlParams };
        if (hasUTMParams(mergedParams)) setUtmParams(mergedParams);

      } catch (err) {
        console.error('Error in loadForm:', err);
        setError('เกิดข้อผิดพลาดในการโหลดแบบสอบถาม');
      } finally {
        setLoading(false);
      }
    }

    if (slug) loadForm();
  }, [slug, searchParams]);

  const handleSubmit = async (responses: Record<string, unknown>) => {
    if (!form) return;
    setSubmitting(true);

    try {
      // แยก consent data
      const consentData = responses._consent as any;
      const { _consent, ...cleanResponses } = responses;

      let qrCodeId: string | null = null;
      let projectId: string | null = null;
      const finalUtmParams = { ...utmParams };

      // ค้นหา qr_code_id ถ้ามี QR slug
      const currentQrSlug = searchParams.get('_qr') || qrSlug;
      if (currentQrSlug) {
        const qrRes = await fetch(`/api/qr-codes/${currentQrSlug}`);
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qrCodeId = qrData.id;
          projectId = qrData.project_id;
          if (!finalUtmParams.utm_source && qrData.utm_source) finalUtmParams.utm_source = qrData.utm_source;
          if (!finalUtmParams.utm_medium && qrData.utm_medium) finalUtmParams.utm_medium = qrData.utm_medium;
          if (!finalUtmParams.utm_campaign && qrData.utm_campaign) finalUtmParams.utm_campaign = qrData.utm_campaign;
        }
      }

      // ส่ง submission ผ่าน API
      const res = await fetch(`/api/forms/${form.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: cleanResponses,
          qr_code_id: qrCodeId,
          project_id: projectId,
          utm_source: finalUtmParams.utm_source || null,
          utm_medium: finalUtmParams.utm_medium || null,
          utm_campaign: finalUtmParams.utm_campaign || null,
          utm_content: finalUtmParams.utm_content || null,
          utm_term: finalUtmParams.utm_term || null,
          metadata: {
            consent_given: consentData?.given || false,
            consent_ip: consentData?.ip || null,
            consent_location: consentData?.location || null,
            consented_at: consentData?.at || null,
          },
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit');

      // ส่ง CSS integration ถ้า enabled
      if ((form as any).css_integration_enabled && (form as any).css_field_mapping) {
        const cssConfigRes = await fetch('/api/admin/settings/css');
        if (cssConfigRes.ok) {
          const cssConfig = await cssConfigRes.json();
          if (cssConfig.contactChannelId && cssConfig.userCreated) {
            sendToCSS(
              cleanResponses as Record<string, any>,
              (form as any).css_field_mapping,
              cssConfig.contactChannelId,
              cssConfig.userCreated,
              { utm_medium: finalUtmParams.utm_medium, utm_source: finalUtmParams.utm_source }
            ).catch(console.error);
          }
        }
      }

      clearUTMSession();
      setSubmitStatus({ type: 'success', message: 'ส่งคำตอบสำเร็จ!', show: true });

    } catch (err: any) {
      console.error('Submit error:', err);
      setSubmitStatus({ type: 'error', message: err.message || 'กรุณาลองใหม่', show: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseStatus = () => {
    setSubmitStatus(prev => ({ ...prev, show: false }));
    if (submitStatus.type === 'success' && form) window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isInactive) return <FormInactiveState />;

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">ไม่พบหน้านี้</h1>
          <p className="text-slate-600">{error || 'แบบสอบถามไม่พบหรือถูกลบ'}</p>
        </div>
      </div>
    );
  }

  const isDraft = form.status === 'draft';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="w-full max-w-7xl mx-auto">
        {isDraft && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-600 text-sm">⚠️</span>
              </div>
              <div>
                <p className="font-medium text-amber-900">แบบสอบถามฉบับร่าง (Draft)</p>
                <p className="text-sm text-amber-700">ฟอร์มนี้ยังไม่ได้เผยแพร่ ใช้สำหรับทดสอบเท่านั้น</p>
              </div>
            </div>
          </div>
        )}

        <FormRenderer form={form} onSubmit={handleSubmit} submitting={submitting} />

        <div className="text-center mt-8 text-sm text-slate-400">
          Powered by Questionnaire QR System
        </div>
      </div>

      {submitStatus.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            {submitStatus.type === 'success' ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">ส่งคำตอบสำเร็จ!</h3>
                <p className="text-slate-500 mb-6">ขอบคุณที่สละเวลาตอบแบบสอบถาม</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">เกิดข้อผิดพลาด</h3>
                <p className="text-slate-500 mb-6">{submitStatus.message}</p>
              </>
            )}
            <button
              onClick={handleCloseStatus}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${submitStatus.type === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
            >
              {submitStatus.type === 'success' ? 'ตกลง' : 'ลองใหม่'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <FormPageContent />
    </Suspense>
  );
}
