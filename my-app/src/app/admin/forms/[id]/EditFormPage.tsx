'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FormBuilder } from '@/components/FormBuilder';
import { FormRenderer } from '@/components/FormRenderer';
import { VersionHistory } from '@/components/VersionHistory';
import { DuplicateFormDialog } from '@/components/DuplicateFormDialog';
import { getSupabaseBrowser } from '@/lib/supabase';
import { useFormDraft } from '@/hooks/useFormDraft';
import { Form, FormField } from '@/types';
import { 
  ArrowLeft, Save, Eye, Hash, X, Shield, CheckCircle, AlertCircle, 
  Rocket, History, Settings, FileEdit, Copy, RotateCcw, MoreVertical,
  Edit3, GitBranch
} from 'lucide-react';
// Eye is already imported
import { getVersionBadgeStyle } from '@/lib/versionColors';
import { cn } from '@/lib/utils';

type TabType = 'content' | 'settings' | 'history';

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = params.id as string;
  const isDraftMode = searchParams.get('draft') === 'true';
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [showPreview, setShowPreview] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Draft system
  const { draft, saveDraft, discard: discardDraft } = useFormDraft(formId);
  const hasDraft = !!draft;
  const isEditingDraft = hasDraft && draft.status === 'editing';
  
  // Form state
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
  
  const [originalFields, setOriginalFields] = useState<FormField[]>([]);
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Load form data
  useEffect(() => {
    async function loadForm() {
      try {
        const supabase = getSupabaseBrowser();
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();
        
        if (error || !data) {
          router.push('/admin/forms');
          return;
        }
        
        const formData = data as Form;
        setForm(formData);
        
        // If has draft and user comes with ?draft=true, use draft data
        if (draft && isDraftMode) {
          setTitle(draft.title);
          setSlug(formData.slug);
          setDescription(draft.description || '');
          setFields(draft.fields);
          setOriginalFields(JSON.parse(JSON.stringify(draft.fields)));
          setLogoUrl(draft.logo_url || '');
          setRequireConsent(draft.require_consent);
          setConsentHeading(draft.consent_heading);
          setConsentText(draft.consent_text || '');
          setConsentRequireLocation(draft.consent_require_location);
          setIsActive(formData.is_active);
        } else {
          // Use published form data
          setTitle(formData.title);
          setSlug(formData.slug);
          setDescription(formData.description || '');
          setFields(formData.fields);
          setOriginalFields(JSON.parse(JSON.stringify(formData.fields)));
          setLogoUrl(formData.logo_url || '');
          setRequireConsent(formData.require_consent || false);
          setConsentHeading(formData.consent_heading || 'การยินยอม (Consent)');
          setConsentText(formData.consent_text || '');
          setConsentRequireLocation(formData.consent_require_location || false);
          setIsActive(formData.is_active);
        }
      } catch (err) {
        console.error('Error loading form:', err);
        router.push('/admin/forms');
      } finally {
        setLoading(false);
      }
    }
    
    if (formId) {
      loadForm();
    }
  }, [formId, draft, isDraftMode]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!form || form.status !== 'published' || !isEditingDraft) return;
    
    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [form, title, description, fields, logoUrl, requireConsent, consentHeading, consentText, consentRequireLocation]);

  const handleAutoSave = async () => {
    if (!form || form.status !== 'published') return;
    
    try {
      await saveDraft({
        form_id: formId,
        title,
        description,
        logo_url: logoUrl,
        fields,
        require_consent: requireConsent,
        consent_heading: consentHeading,
        consent_text: consentText,
        consent_require_location: consentRequireLocation,
      });
      console.log('Draft auto-saved');
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveDraft({
        form_id: formId,
        title,
        description,
        logo_url: logoUrl,
        fields,
        require_consent: requireConsent,
        consent_heading: consentHeading,
        consent_text: consentText,
        consent_require_location: consentRequireLocation,
      });
      showToast('success', 'บันทึก Draft สำเร็จ');
    } catch (err) {
      console.error('Save as draft error:', err);
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึก: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setIsSaving(true);
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', formId);
      
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ');
    } catch (err) {
      console.error('Save draft error:', err);
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึก: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการละทิ้ง Draft?')) return;
    
    try {
      await discardDraft();
      router.refresh();
      window.location.href = `/admin/forms/${formId}`;
    } catch (err) {
      showToast('error', 'เกิดข้อผิดพลาด');
    }
  };

  const handlePublish = async () => {
    if (!title || !slug) {
      showToast('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      const currentVersion = form?.current_version || 0;
      const newVersion = currentVersion + 1;
      
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
          current_version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formId);
      
      if (updateError) throw updateError;
      
      const { error: versionError } = await supabase
        .from('form_versions')
        .insert({
          form_id: formId,
          version: newVersion,
          fields: fields,
          title,
          description,
          logo_url: logoUrl,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
          change_summary: draft?.is_revert 
            ? `Reverted to v${draft.revert_to_version} + edits` 
            : `Updated to version ${newVersion}`,
          published_at: new Date().toISOString(),
        });
      
      if (versionError) throw versionError;
      
      if (hasDraft) {
        await discardDraft();
      }
      
      showToast('success', `Publish สำเร็จ (Version ${newVersion})`);
      
      setTimeout(() => {
        window.location.href = '/admin/forms';
      }, 800);
    } catch (err: any) {
      console.error('Publish error:', err);
      showToast('error', err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSaving(false);
    }
  };

  const hasFieldsChanged = (): boolean => {
    if (!originalFields || originalFields.length === 0) return true;
    if (fields.length !== originalFields.length) return true;
    return JSON.stringify(fields) !== JSON.stringify(originalFields);
  };

  const isValid = title && slug && fields.length > 0;

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
    <div className="space-y-6">
      {/* Draft Alert */}
      {isEditingDraft && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Edit3 className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                คุณกำลังแก้ไข Draft
                {draft.is_revert && (
                  <span className="ml-2 text-sm font-normal">
                    (Revert จาก v{draft.revert_to_version})
                  </span>
                )}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                ฟอร์มที่ Publish อยู่ (v{form.current_version}) ยังไม่มีการเปลี่ยนแปลง 
                ผู้ใช้ยังเห็นเวอร์ชันเดิมอยู่
              </p>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={handleDiscardDraft}
                  className="px-3 py-1.5 text-amber-700 text-sm hover:underline"
                >
                  ละทิ้ง Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/forms"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] xl:max-w-[600px]" title={form.title}>{form.title}</h1>
            <p className="text-sm text-slate-500">{form.code} · แก้ไขเนื้อหา</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {form.status === 'published' && (
              <span 
                className="px-3 py-1.5 text-sm font-medium rounded-lg border"
                style={getVersionBadgeStyle(form.current_version || 0)}
              >
                Version {form.current_version || 0}
              </span>
            )}
            {hasDraft && (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" />
                มี Draft
              </span>
            )}
          </div>
          
          <div className="w-px h-8 bg-slate-300 hidden sm:block" />
          
          <button 
            onClick={() => setShowDuplicateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">คัดลอก</span>
          </button>
          
          <button 
            onClick={() => setShowPreview(true)} 
            className="flex items-center gap-2 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">ดูตัวอย่าง</span>
          </button>
          
          {form.status === 'published' && (
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 lg:px-6 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'กำลังบันทึก...' : (hasDraft ? 'บันทึก Draft' : 'สร้าง Draft')}
            </button>
          )}
          
          {form.status === 'draft' && (
            <button
              onClick={handleSaveAsDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 lg:px-6 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          )}
          
          <button
            onClick={handlePublish}
            disabled={!isValid || isSaving}
            className="flex items-center gap-2 px-4 lg:px-6 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Rocket className="w-4 h-4" />
            {isSaving ? 'กำลังบันทึก...' : (form.status === 'published' ? `Publish v${(form.current_version || 0) + 1}` : 'Publish')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {[
            { key: 'content' as TabType, label: 'เนื้อหา', icon: <FileEdit className="w-4 h-4" /> },
            { key: 'settings' as TabType, label: 'ตั้งค่า', icon: <Settings className="w-4 h-4" /> },
            { key: 'history' as TabType, label: 'ประวัติ', icon: <History className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'content' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
              <h2 className="text-lg font-semibold mb-4">ข้อมูลพื้นฐาน</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อแบบสอบถาม</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">URL (Slug)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm whitespace-nowrap">/form/</span>
                      <input 
                        type="text" 
                        value={slug} 
                        onChange={(e) => setSlug(e.target.value)} 
                        className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl font-mono text-sm" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo (URL)</label>
                    <input 
                      type="text" 
                      value={logoUrl} 
                      onChange={(e) => setLogoUrl(e.target.value)} 
                      placeholder="https://example.com/logo.png" 
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">คำอธิบาย</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3} 
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl resize-none" 
                  />
                </div>
                {logoUrl && <img src={logoUrl} alt="Logo" className="mt-3 h-12 object-contain" />}
              </div>
            </div>

            {/* Form Builder */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
              <h2 className="text-lg font-semibold mb-4">คำถาม</h2>
              <FormBuilder fields={fields} onChange={setFields} currentVersion={form.current_version || 0} />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold">การตั้งค่าความยินยอม</h2>
              </div>
              <label className="flex items-start gap-3 p-4 border-2 border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                <input 
                  type="checkbox" 
                  checked={requireConsent} 
                  onChange={(e) => setRequireConsent(e.target.checked)} 
                  className="w-5 h-5 mt-0.5" 
                />
                <div>
                  <div className="font-medium">ต้องการให้ผู้ตอบกดยินยอมก่อนส่ง</div>
                  <div className="text-sm text-slate-500">บันทึก IP และ timestamp</div>
                </div>
              </label>
              {requireConsent && (
                <div className="ml-0 sm:ml-8 mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">หัวข้อ Consent</label>
                    <input 
                      type="text" 
                      value={consentHeading} 
                      onChange={(e) => setConsentHeading(e.target.value)} 
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ข้อความยินยอม</label>
                    <textarea 
                      value={consentText} 
                      onChange={(e) => setConsentText(e.target.value)} 
                      rows={3} 
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl resize-none" 
                    />
                  </div>
                  <label className="flex items-start gap-3 p-3 border-2 border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      checked={consentRequireLocation} 
                      onChange={(e) => setConsentRequireLocation(e.target.checked)} 
                      className="w-4 h-4 mt-0.5" 
                    />
                    <div>
                      <div className="font-medium">ขอตำแหน่ง GPS</div>
                      <div className="text-sm text-slate-500">ขอพิกัดตำแหน่งจากเบราว์เซอร์</div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <VersionHistory formId={formId} currentVersion={form.current_version || 0} />
        )}
      </div>

      {/* Full Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl my-4 rounded-xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between z-10 shrink-0">
              <h3 className="font-semibold">ตัวอย่าง</h3>
              <button onClick={() => setShowPreview(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 bg-slate-100 overflow-y-auto">
              {/* Preview Label */}
              <div className="max-w-3xl mx-auto mb-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                  <Eye className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">โหมดตัวอย่าง</p>
                    <p className="text-sm text-amber-600">ฟอร์มนี้แสดงตัวอย่างการใช้งานจริง แต่ไม่บันทึกข้อมูล</p>
                  </div>
                </div>
              </div>
              
              {/* Actual Form Preview */}
              <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-b from-blue-600 to-blue-500 p-6 text-center text-white">
                  {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 mx-auto object-contain mb-4" />}
                  <h1 className="text-2xl font-bold mb-2">{title || 'ชื่อแบบสอบถาม'}</h1>
                  {description && <p className="text-blue-100 text-sm">{description}</p>}
                </div>
                <div className="p-6">
                  <FormRenderer 
                    form={previewForm} 
                    onSubmit={(data) => {
                      alert('นี่คือตัวอย่างฟอร์มเท่านั้น\n\nข้อมูลที่กรอก:\n' + JSON.stringify(data, null, 2));
                    }} 
                    submitting={false}
                    submitLabel="ส่งคำตอบ (ตัวอย่าง)"
                  />
                </div>
              </div>
              
              {/* Bottom spacing */}
              <div className="h-8"></div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Dialog */}
      <DuplicateFormDialog 
        form={form} 
        isOpen={showDuplicateDialog} 
        onClose={() => setShowDuplicateDialog(false)} 
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
