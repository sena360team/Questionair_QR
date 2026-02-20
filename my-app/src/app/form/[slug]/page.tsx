'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FormRenderer } from '@/components/FormRenderer';
import { getUTMParamsFromURL, getUTMFromSession, clearUTMSession, storeUTMInSession, hasUTMParams } from '@/lib/utm';
import { Form } from '@/types';
import { getSupabaseBrowser } from '@/lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';
import FormInactiveState from '@/components/FormInactiveState';
import { sendToCSS } from '@/lib/css-api';

interface SubmitStatus {
  type: 'success' | 'error';
  message: string;
  show: boolean;
}

export default function FormPage() {
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
        // ดึงฟอร์มจาก Supabase (ดึงทุกสถานะ แต่ตรวจสอบที่หลัง)
        console.log('🔍 Starting loadForm...');
        const supabase = getSupabaseBrowser();
        console.log('🔍 Supabase client:', supabase ? 'OK' : 'NULL');
        console.log('🔍 Loading form with slug:', slug);
        
        // ลองใช้ match หรือ eq แทน ilike
        console.log('🔍 Executing query...');
        const result = await supabase
          .from('forms')
          .select('*')
          .eq('slug', slug)
          .single();
        
        console.log('🔍 Query result:', { data: result.data, error: result.error });
        console.log('🔍 Logo URL:', result.data?.logo_url);
        
        if (result.error) {
          console.error('❌ Supabase error:', result.error);
          setError(`ไม่พบแบบสอบถาม: ${result.error.message}`);
          return;
        }
        
        if (!result.data) {
          console.error('❌ No data found for slug:', slug);
          setError(`ไม่พบแบบสอบถามที่มี slug: ${slug}`);
          return;
        }
        
        const isActive = result.data.is_active ?? true; // default to true if undefined
        console.log('🔍 Form check:', { is_active: result.data.is_active, isActive, status: result.data.status });
        
        // ตรวจสอบสถานะฟอร์ม
        // - draft: แสดงได้เสมอ (สำหรับทดสอบ)
        // - published: ต้อง is_active = true
        // - archived: ไม่สามารถดูได้
        if (result.data.status === 'archived') {
          console.log('❌ Form is archived');
          setError('แบบสอบถามนี้ไม่สามารถใช้งานได้แล้ว');
          return;
        }
        
        if (result.data.status === 'published' && !isActive) {
          console.log('❌ Published form is inactive');
          setIsInactive(true);
          return;
        }
        
        setForm(result.data as Form);
        
        // ดึง QR slug จาก query param (สำหรับ QR Code tracking)
        const qrSlugFromUrl = searchParams.get('_qr');
        if (qrSlugFromUrl) {
          setQrSlug(qrSlugFromUrl);
          console.log('🔍 QR Slug from URL:', qrSlugFromUrl);
        }
        
        // ดึง UTM จาก URL (ถ้ามี)
        const urlParams = getUTMParamsFromURL();
        
        // ถ้าไม่มีใน URL ให้ดูใน session (กรณี redirect จาก /qr/[slug])
        const sessionParams = hasUTMParams(urlParams) ? {} : getUTMFromSession();
        
        const mergedParams = { ...sessionParams, ...urlParams };
        console.log('🔍 UTM Params loaded:', mergedParams);
        console.log('🔍 Session params:', sessionParams);
        console.log('🔍 URL params:', urlParams);
        
        // เก็บ UTM ไว้ก่อน ล้างหลัง submit สำเร็จ
        if (hasUTMParams(mergedParams)) {
          setUtmParams(mergedParams);
          // ไม่ล้าง session ทันที รอให้ submit สำเร็จก่อน
          // clearUTMSession();
        } else {
          setUtmParams({});
        }
        
      } catch (err) {
        console.error('❌ Error in loadForm:', err);
        setError('เกิดข้อผิดพลาดในการโหลดแบบสอบถาม');
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      loadForm();
    }
  }, [slug, searchParams]);

  const handleSubmit = async (responses: Record<string, unknown>) => {
    if (!form) return;
    
    setSubmitting(true);
    console.log('📝 Starting submission...', { formId: form.id });
    
    try {
      // แยก consent data ออกจาก responses
      const consentData = responses._consent as {
        given: boolean;
        at: string;
        ip: string | null;
        location: { latitude: number; longitude: number; accuracy?: number } | null;
      } | null;
      
      console.log('📝 Consent data:', consentData);
      
      // ลบ _consent ออกจาก responses ก่อนบันทึก
      const { _consent, ...cleanResponses } = responses;
      
      // หา qr_code_id และ project_id จาก QR Slug (ถ้ามี)
      let qrCodeId: string | null = null;
      let projectId: string | null = null;
      
      // ดึง qr_slug จาก query param ที่ส่งมาจาก QR redirect
      const currentQrSlug = searchParams.get('_qr') || qrSlug;
      console.log('📝 QR Slug from query param:', currentQrSlug);
      
      // สร้าง copy ของ UTM params เพื่อให้แก้ไขได้
      const finalUtmParams = { ...utmParams };
      
      if (currentQrSlug) {
        console.log('📝 Looking up QR code by qr_slug:', currentQrSlug);
        console.log('📝 Form ID:', form.id);
        const supabase = getSupabaseBrowser();
        const qrResult = await supabase
          .from('qr_codes')
          .select('id, project_id, utm_content, qr_slug, utm_source, utm_medium, utm_campaign')
          .eq('qr_slug', currentQrSlug)
          .maybeSingle();
          
        console.log('📝 QR lookup result:', qrResult);
        console.log('📝 QR data:', qrResult.data);
          
        if (qrResult.data) {
          qrCodeId = qrResult.data.id;
          projectId = qrResult.data.project_id;
          console.log('📝 Found QR Code:', qrCodeId, 'Project:', projectId);
          
          // ถ้า UTM ยังไม่มี ให้ใช้จาก QR Code
          if (!finalUtmParams.utm_source && qrResult.data.utm_source) {
            finalUtmParams.utm_source = qrResult.data.utm_source;
          }
          if (!finalUtmParams.utm_medium && qrResult.data.utm_medium) {
            finalUtmParams.utm_medium = qrResult.data.utm_medium;
          }
          if (!finalUtmParams.utm_campaign && qrResult.data.utm_campaign) {
            finalUtmParams.utm_campaign = qrResult.data.utm_campaign;
          }
        } else {
          console.log('📝 QR Code not found by slug, trying utm_content fallback...');
          // Fallback: ถ้าหาไม่เจอ ลองหาด้วย utm_content (สำหรับ QR เก่า)
          if (finalUtmParams.utm_content) {
            const fallbackResult = await supabase
              .from('qr_codes')
              .select('id, project_id, utm_content, qr_slug')
              .eq('form_id', form.id)
              .eq('utm_content', finalUtmParams.utm_content)
              .maybeSingle();
            if (fallbackResult.data) {
              qrCodeId = fallbackResult.data.id;
              projectId = fallbackResult.data.project_id;
              console.log('📝 Found QR Code via fallback:', qrCodeId);
            }
          }
        }
      } else {
        console.log('📝 No QR slug provided, skipping QR lookup');
      }
      
      // เตรียมข้อมูล submission
      const submissionData: Record<string, unknown> = {
        form_id: form.id,
        form_version: form.current_version || 1,
        responses: cleanResponses,
        utm_source: finalUtmParams.utm_source || null,
        utm_medium: finalUtmParams.utm_medium || null,
        utm_campaign: finalUtmParams.utm_campaign || null,
        utm_content: finalUtmParams.utm_content || null,
        utm_term: finalUtmParams.utm_term || null,
        // Consent Stamp
        consent_given: consentData?.given || false,
        consent_ip: consentData?.ip || null,
        consent_location: consentData?.location || null,
        consented_at: consentData?.at || null,
      };
      
      // เพิ่ม qr_code_id และ project_id ถ้ามี (จาก UTM)
      if (qrCodeId) {
        submissionData.qr_code_id = qrCodeId;
      }
      if (projectId) {
        submissionData.project_id = projectId;
      }
      
      console.log('📝 Submitting data:', submissionData);
      
      // บันทึก submission
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.from('submissions').insert(submissionData).select();
      
      if (error) {
        console.error('❌ Supabase insert error:');
        console.error('  Code:', error.code);
        console.error('  Message:', error.message);
        console.error('  Details:', error.details);
        console.error('  Hint:', error.hint);
        throw error;
      }
      
      console.log('✅ Submission saved:', data);
      
      // Send to CSS if enabled
      if (form.css_integration_enabled && form.css_field_mapping) {
        console.log('📤 Sending to CSS...');
        
        // Fetch global CSS config from settings
        const { data: cssConfigData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'css_api_config')
          .single();
        
        const cssConfig = cssConfigData?.value || {};
        
        if (!cssConfig.contactChannelId || !cssConfig.userCreated) {
          console.warn('⚠️ CSS Config not set in global settings');
        } else {
          const qrData = {
            utm_medium: finalUtmParams.utm_medium || undefined,
            utm_source: finalUtmParams.utm_source || undefined,
            utm_campaign: finalUtmParams.utm_campaign || undefined,
          };
          
          sendToCSS(
            cleanResponses as Record<string, any>,
            form.css_field_mapping,
            cssConfig.contactChannelId,
            cssConfig.userCreated,
            qrData
          ).then(result => {
            if (result.success) {
              console.log('✅ CSS API: Sent successfully');
            } else {
              console.error('❌ CSS API Error:', result.error);
            }
          }).catch(err => {
            console.error('❌ CSS API Exception:', err);
          });
        }
      }
      
      // ล้าง UTM session หลัง submit สำเร็จ
      clearUTMSession();
      console.log('🔍 UTM session cleared after successful submission');
      
      setSubmitStatus({ type: 'success', message: 'ส่งคำตอบสำเร็จ!', show: true });
      
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      setSubmitStatus({ type: 'error', message: err.message || 'กรุณาลองใหม่', show: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseStatus = () => {
    setSubmitStatus(prev => ({ ...prev, show: false }));
    // ถ้าสำเร็จ ให้ redirect กลับไปหน้าแรกหรือรีเฟรชฟอร์ม
    if (submitStatus.type === 'success' && form) {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isInactive) {
    return <FormInactiveState />;
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">ไม่พบหน้านี้</h1>
          <p className="text-slate-600">{error || 'แบวสอบถามไม่พบหรือถูกลบ'}</p>
        </div>
      </div>
    );
  }

  const isDraft = form.status === 'draft';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="w-full max-w-7xl mx-auto">
        {/* Draft Warning Banner */}
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
        
        {/* Form with Theme */}
        <FormRenderer
          form={form}
          onSubmit={handleSubmit}
          submitting={submitting}
        />

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-400">
          Powered by Questionnaire QR System
        </div>
      </div>

      {/* Submission Status Modal */}
      {submitStatus.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            {submitStatus.type === 'success' ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  ส่งคำตอบสำเร็จ!
                </h3>
                <p className="text-slate-500 mb-6">
                  ขอบคุณที่สละเวลาตอบแบบสอบถาม
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  เกิดข้อผิดพลาด
                </h3>
                <p className="text-slate-500 mb-6">
                  {submitStatus.message}
                </p>
              </>
            )}
            <button
              onClick={handleCloseStatus}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${
                submitStatus.type === 'success'
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

function hasUTMParams(params: Record<string, string>): boolean {
  return Object.values(params).some(v => v !== undefined && v !== '');
}
