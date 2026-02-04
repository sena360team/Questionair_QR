'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormBuilder } from '@/components/FormBuilder';
import { FormRenderer } from '@/components/FormRenderer';
import { getSupabaseBrowser } from '@/lib/supabase';
import { Form, FormField } from '@/types';
import { ArrowLeft, Save, Eye, Hash, FileText, X, Shield, CheckCircle, AlertCircle, Rocket } from 'lucide-react';

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  
  console.log('📄 EditFormPage Render - Form ID:', formId);
  console.log('📄 Full URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [requireConsent, setRequireConsent] = useState(false);
  const [consentHeading, setConsentHeading] = useState('การยินยอม (Consent)');
  const [consentText, setConsentText] = useState('');
  const [consentRequireLocation, setConsentRequireLocation] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Toast notification state
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadForm() {
      console.log('🔍 Loading form data for ID:', formId);
      try {
        const supabase = getSupabaseBrowser();
        console.log('🔍 Querying Supabase...');
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();
        
        console.log('🔍 Supabase Result:', { data, error });
        
        if (error || !data) {
          console.error('❌ Form not found or error:', error);
          router.push('/admin/forms');
          return;
        }
        console.log('✅ Form loaded:', data.title);
        
        const formData = data as Form;
        setForm(formData);
        setTitle(formData.title);
        setSlug(formData.slug);
        setDescription(formData.description || '');
        setFields(formData.fields);
        setLogoUrl(formData.logo_url || '');
        setRequireConsent(formData.require_consent || false);
        setConsentHeading(formData.consent_heading || 'การยินยอม (Consent)');
        setConsentText(formData.consent_text || '');
        setConsentRequireLocation(formData.consent_require_location || false);
        setIsActive(formData.is_active);
      } catch (err) {
        console.error('❌ Error loading form:', err);
        router.push('/admin/forms');
      } finally {
        setLoading(false);
      }
    }
    
    if (formId) loadForm();
  }, [formId, router]);

  const handleSave = async () => {
    if (!title || !slug) {
      showToast('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from('forms')
        .update({
          title,
          slug,
          description,
          fields,
          logo_url: logoUrl,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
          is_active: isActive,
        })
        .eq('id', formId);
      
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ');
      router.push('/admin/forms');
    } catch (err) {
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title || !slug) {
      showToast('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      
      // คำนวณ version ใหม่
      const newVersion = (form.current_version || 0) + 1;
      
      // 1. บันทึกฟอร์ม + current_version
      const { error: updateError } = await supabase
        .from('forms')
        .update({
          title,
          slug,
          description,
          fields,
          logo_url: logoUrl,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
          is_active: true,
          status: 'published',
          current_version: newVersion,
        })
        .eq('id', formId);
      
      if (updateError) {
        console.error('Update form error:', updateError);
        throw new Error(`Update form failed: ${updateError.message}`);
      }
      
      // 2. สร้าง version ใหม่
      const { error: versionError } = await supabase
        .from('form_versions')
        .insert({
          form_id: formId,
          version: newVersion,
          fields: fields,
          change_summary: `Published version ${newVersion}`,
          published_at: new Date().toISOString(),
        });
      
      if (versionError) {
        console.error('Insert version error:', versionError);
        throw new Error(`Create version failed: ${versionError.message}`);
      }
      
      showToast('success', `Publish สำเร็จ (v${newVersion})`);
      router.push('/admin/forms');
    } catch (err: any) {
      console.error('Publish error:', err);
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการ Publish');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!form) return null;

  const previewForm: Form = {
    ...form,
    title,
    description,
    logo_url: logoUrl,
    fields,
    require_consent: requireConsent,
    consent_heading: consentHeading,
    consent_text: consentText,
    consent_require_location: consentRequireLocation,
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/forms" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">แก้ไขแบบสอบถาม</h1>
            <p className="text-slate-500">{form.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50">
            <Eye className="w-5 h-5" /> ดูตัวอย่าง
          </button>
          {form.status === 'draft' && (
            <button onClick={handlePublish} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50">
              <Rocket className="w-5 h-5" /> {saving ? 'กำลัง Publish...' : 'Publish'}
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-5 h-5" /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* กล่องรหัสแบบสอบถาม + Status + Version + Toggle เปิด/ปิด */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Hash className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">รหัสแบบสอบถาม</span>
              </div>
              <span className="text-3xl font-mono font-bold text-blue-700">{form.code}</span>
              
              {/* Badges */}
              <div className="flex items-center gap-2 mt-3">
                {/* Status */}
                {form.status === 'draft' && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                    Draft
                  </span>
                )}
                {form.status === 'published' && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Published
                  </span>
                )}
                {form.status === 'archived' && (
                  <span className="px-3 py-1 bg-slate-200 text-slate-600 text-sm font-medium rounded-full">
                    Archived
                  </span>
                )}
                
                {/* Version */}
                {form.current_version && form.current_version > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    v{form.current_version}
                  </span>
                )}
                
                {/* Active/Inactive */}
                {form.status === 'published' && (
                  isActive ? (
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      เปิดใช้งาน
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-sm rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full" />
                      ปิดใช้งาน
                    </span>
                  )
                )}
              </div>
            </div>
            
            {/* Toggle เปิด/ปิด - เฉพาะ Published */}
            {form.status === 'published' && (
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <span className="text-xs font-medium text-slate-500">
                  {isActive ? 'เปิด' : 'ปิด'}
                </span>
                <div className={`relative w-14 h-8 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)} 
                    className="sr-only" 
                  />
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">ข้อมูลพื้นฐาน</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อแบบสอบถาม</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">URL (Slug)</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">/form/</span>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="flex-1 px-4 py-3 border rounded-xl font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">คำอธิบาย</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 border rounded-xl resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo (URL)</label>
              <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="w-full px-4 py-3 border rounded-xl" />
              {logoUrl && <img src={logoUrl} alt="Logo" className="mt-3 h-12 object-contain" />}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">คำถาม</h2>
          <FormBuilder fields={fields} onChange={setFields} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">การตั้งค่าความยินยอม</h2>
          </div>
          <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50">
            <input type="checkbox" checked={requireConsent} onChange={(e) => setRequireConsent(e.target.checked)} className="w-5 h-5" />
            <div>
              <div className="font-medium">ต้องการให้ผู้ตอบกดยินยอมก่อนส่ง</div>
              <div className="text-sm text-slate-500">บันทึก IP และ timestamp ตอนยินยอม</div>
            </div>
          </label>
          {requireConsent && (
            <div className="ml-8 mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">หัวข้อ Consent</label>
                <input type="text" value={consentHeading} onChange={(e) => setConsentHeading(e.target.value)} className="w-full px-4 py-3 border rounded-xl" placeholder="การยินยอม (Consent)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ข้อความยินยอม</label>
                <textarea value={consentText} onChange={(e) => setConsentText(e.target.value)} rows={3} className="w-full px-4 py-3 border rounded-xl resize-none" placeholder="ข้อความยินยอม" />
              </div>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={consentRequireLocation} onChange={(e) => setConsentRequireLocation(e.target.checked)} className="w-4 h-4" />
                <div>
                  <div className="font-medium">ขอตำแหน่ง GPS</div>
                  <div className="text-sm text-slate-500">เพิ่มการขอพิกัดตำแหน่งจากเบราว์เซอร์</div>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl my-8 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between z-10 shrink-0">
              <h3 className="font-semibold">ตัวอย่าง</h3>
              <button onClick={() => setShowPreview(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 bg-slate-50 overflow-y-auto">
              <div className="max-w-2xl mx-auto bg-white rounded-xl shadow overflow-hidden">
                {/* Form Header - Blue Gradient */}
                <div className="bg-gradient-to-b from-blue-600 to-blue-500 p-8 text-center text-white shadow-lg">
                  {logoUrl && (
                    <div className="mb-4">
                      <img src={logoUrl} alt="Logo" className="h-16 mx-auto object-contain" />
                    </div>
                  )}
                  <h1 className="text-2xl font-bold mb-3">{title}</h1>
                  {description && (
                    <p className="text-blue-100 text-sm">{description}</p>
                  )}
                </div>
                <div className="p-8">
                  <FormRenderer form={previewForm} onSubmit={() => {}} submitting={false} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
