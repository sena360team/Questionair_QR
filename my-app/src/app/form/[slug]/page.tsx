'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FormRenderer } from '@/components/FormRenderer';
import { getUTMParamsFromURL, getUTMFromSession, clearUTMSession, storeUTMInSession, hasUTMParams } from '@/lib/utm';
import { Form } from '@/types';
import { getSupabaseBrowser } from '@/lib/supabase';

export default function FormPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});

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
          setError('แบบสอบถามนี้ถูกปิดใช้งานชั่วคราว');
          return;
        }
        
        setForm(result.data as Form);
        
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
  }, [slug]);

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
      
      // หา qr_code_id และ project_id จาก UTM (ถ้ามี)
      let qrCodeId: string | null = null;
      let projectId: string | null = null;
      
      console.log('📝 Current UTM params:', utmParams);
      console.log('📝 utm_content:', utmParams.utm_content);
      
      if (utmParams.utm_content) {
        console.log('📝 Looking up QR code by utm_content:', utmParams.utm_content);
        console.log('📝 Form ID:', form.id);
        const supabase = getSupabaseBrowser();
        const qrResult = await supabase
          .from('qr_codes')
          .select('id, project_id, utm_content, qr_slug')
          .eq('form_id', form.id)
          .eq('utm_content', utmParams.utm_content)
          .maybeSingle();
          
        console.log('📝 QR lookup result:', qrResult);
        console.log('📝 QR data:', qrResult.data);
          
        if (qrResult.data) {
          qrCodeId = qrResult.data.id;
          projectId = qrResult.data.project_id;
          console.log('📝 Found QR Code:', qrCodeId, 'Project:', projectId);
        } else {
          console.log('📝 QR Code not found!');
        }
      } else {
        console.log('📝 No utm_content, skipping QR lookup');
      }
      
      // เตรียมข้อมูล submission
      const submissionData: Record<string, unknown> = {
        form_id: form.id,
        form_version: form.current_version || 1,
        responses: cleanResponses,
        utm_source: utmParams.utm_source || null,
        utm_medium: utmParams.utm_medium || null,
        utm_campaign: utmParams.utm_campaign || null,
        utm_content: utmParams.utm_content || null,
        utm_term: utmParams.utm_term || null,
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
      
      // ล้าง UTM session หลัง submit สำเร็จ
      clearUTMSession();
      console.log('🔍 UTM session cleared after successful submission');
      
      alert('ส่งคำตอบสำเร็จ!');
      
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'กรุณาลองใหม่'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

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
      <div className="max-w-2xl mx-auto">
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
        
        {/* Header - Blue Gradient */}
        {console.log('🔍 Rendering header:', { logo_url: form.logo_url, title: form.title })}
        <div className="bg-gradient-to-b from-blue-600 to-blue-500 rounded-xl p-8 mb-6 text-center text-white shadow-lg">
          {form.logo_url ? (
            <div className="mb-4">
              <img src={form.logo_url} alt="Logo" className="h-16 mx-auto object-contain" />
            </div>
          ) : (
            <div className="mb-4 text-blue-200 text-sm">ไม่มี Logo</div>
          )}
          <h1 className="text-2xl font-bold mb-3">{form.title}</h1>
          {form.description && (
            <p className="text-blue-100 text-sm">{form.description}</p>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <FormRenderer
            form={form}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-400">
          Powered by Questionnaire QR System
        </div>
      </div>
    </div>
  );
}

function hasUTMParams(params: Record<string, string>): boolean {
  return Object.values(params).some(v => v !== undefined && v !== '');
}
