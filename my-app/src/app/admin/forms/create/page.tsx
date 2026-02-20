'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormBuilder } from '@/components/FormBuilder';
import { FormRenderer } from '@/components/FormRenderer';
import { useForms } from '@/hooks/useSupabase';
import { slugify } from '@/lib/utils';
import { FormField } from '@/types';
import { ArrowLeft, Save, Eye, X, Hash, FileText, Shield, Rocket, Edit3, CheckCircle, AlertCircle } from 'lucide-react';

// Mock form data for preview
const createMockForm = (
  code: string, 
  title: string, 
  description: string, 
  fields: FormField[], 
  logoUrl?: string, 
  logoPosition?: string, 
  logoSize?: string, 
  theme?: string,
  bannerColor?: string,
  bannerCustomColor?: string,
  bannerMode?: string,
  accentColor?: string,
  accentCustomColor?: string,
  requireConsent?: boolean, 
  consentHeading?: string, 
  consentText?: string, 
  consentRequireLocation?: boolean
) => ({
  id: 'preview',
  code,
  slug: 'preview',
  title,
  description,
  logo_url: logoUrl,
  logo_position: logoPosition,
  logo_size: logoSize,
  theme,
  banner_color: bannerColor,
  banner_custom_color: bannerCustomColor,
  banner_mode: bannerMode,
  accent_color: accentColor,
  accent_custom_color: accentCustomColor,
  fields,
  is_active: true,
  allow_multiple_responses: false,
  require_consent: requireConsent,
  consent_heading: consentHeading,
  consent_text: consentText,
  consent_require_location: consentRequireLocation,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: null,
});

export default function CreateFormPage() {
  const router = useRouter();
  const { forms, createForm } = useForms();
  
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('center');
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [theme, setTheme] = useState<'default' | 'card-groups' | 'step-wizard' | 'minimal'>('default');
  const [bannerColor, setBannerColor] = useState<'blue' | 'black' | 'white' | 'custom'>('blue');
  const [bannerCustomColor, setBannerCustomColor] = useState('#2563EB');
  const [bannerMode, setBannerMode] = useState<'gradient' | 'solid'>('gradient');
  const [accentColor, setAccentColor] = useState<'blue' | 'sky' | 'teal' | 'emerald' | 'violet' | 'rose' | 'orange' | 'slate' | 'black' | 'custom'>('blue');
  const [accentCustomColor, setAccentCustomColor] = useState('#2563EB');
  const [requireConsent, setRequireConsent] = useState(false);
  const [consentHeading, setConsentHeading] = useState('การยินยอม (Consent)');
  const [consentText, setConsentText] = useState('ข้าพเจ้ายินยอมให้เก็บข้อมูลส่วนบุคคลตามที่ระบุในแบบสอบถามนี้');
  const [consentRequireLocation, setConsentRequireLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Auto-generate form code on mount - cannot be changed
  useEffect(() => {
    const existingCodes = forms.map(f => {
      const match = f.code.match(/FRM-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxNum = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const newCode = `FRM-${String(maxNum + 1).padStart(3, '0')}`;
    setCode(newCode);
  }, [forms]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug) {
      setSlug(slugify(value));
    }
  };

  const handleSaveDraft = async () => {
    if (!code || !title || !slug) {
      showToast('error', 'กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      // 1. สร้างฟอร์มเป็น draft ก่อน (current_version = NULL, draft_version = NULL)
      const form = await createForm({
        code,
        title,
        slug,
        description,
        logo_url: logoUrl,
        logo_position: logoPosition,
        logo_size: logoSize,
        theme,
        banner_color: bannerColor,
        banner_custom_color: bannerCustomColor,
        banner_mode: bannerMode,
        accent_color: accentColor,
        accent_custom_color: accentCustomColor,
        fields,
        status: 'draft',
        require_consent: requireConsent,
        consent_heading: consentHeading,
        consent_text: consentText,
        consent_require_location: consentRequireLocation,
      });

      // 2. สร้าง version 0 (draft) ใน form_versions table
      const versionResponse = await fetch('/api/form-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          title,
          description,
          logo_url: logoUrl,
          logo_position: logoPosition,
          logo_size: logoSize,
          theme,
          banner_color: bannerColor,
          banner_custom_color: bannerCustomColor,
          banner_mode: bannerMode,
          accent_color: accentColor,
          accent_custom_color: accentCustomColor,
          fields,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
          change_summary: 'Initial draft',
        }),
      });

      if (!versionResponse.ok) {
        throw new Error('Failed to create version 0 draft');
      }

      showToast('success', 'บันทึก Draft สำเร็จ (v0 draft)');
      setTimeout(() => {
        router.push('/admin/forms');
      }, 500);
    } catch (error) {
      console.error('Save draft error:', error);
      showToast('error', 'เกิดข้อผิดพลาด: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!code || !title || !slug || fields.length === 0) {
      showToast('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      // 1. สร้างฟอร์มเป็น draft ก่อน (current_version = NULL)
      const form = await createForm({
        code,
        title,
        slug,
        description,
        logo_url: logoUrl,
        logo_position: logoPosition,
        logo_size: logoSize,
        theme,
        banner_color: bannerColor,
        banner_custom_color: bannerCustomColor,
        banner_mode: bannerMode,
        accent_color: accentColor,
        accent_custom_color: accentCustomColor,
        fields,
        status: 'draft',  // สร้างเป็น draft ก่อน
        require_consent: requireConsent,
        consent_heading: consentHeading,
        consent_text: consentText,
        consent_require_location: consentRequireLocation,
      });

      // 2. สร้าง version 0 (draft) ใน form_versions table
      const versionResponse = await fetch('/api/form-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          title,
          description,
          logo_url: logoUrl,
          logo_position: logoPosition,
          logo_size: logoSize,
          theme,
          banner_color: bannerColor,
          banner_custom_color: bannerCustomColor,
          banner_mode: bannerMode,
          accent_color: accentColor,
          accent_custom_color: accentCustomColor,
          fields,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
          change_summary: 'Initial version',
        }),
      });

      if (!versionResponse.ok) {
        throw new Error('Failed to create version 0');
      }

      const versionResult = await versionResponse.json();
      const versionId = versionResult.data.id;

      // 3. Publish version 0 ทันที → status: 'published', current_version: 0
      const publishResponse = await fetch('/api/form-versions/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          changeSummary: 'Initial version',
        }),
      });

      if (!publishResponse.ok) {
        throw new Error('Failed to publish version 0');
      }

      showToast('success', 'สร้างและ Publish แบบสอบถามสำเร็จ (v0)');
      setTimeout(() => {
        router.push('/admin/forms');
      }, 500);
    } catch (error) {
      console.error('Publish error:', error);
      showToast('error', 'เกิดข้อผิดพลาด: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setSaving(false);
    }
  };

  const isValid = code && title && slug && fields.length > 0;

  // Create mock form for preview
  const previewForm = createMockForm(
    code || 'FRM-XXX', 
    title || 'ชื่อแบบสอบถาม', 
    description, 
    fields, 
    logoUrl, 
    logoPosition, 
    logoSize, 
    theme,
    bannerColor,
    bannerCustomColor,
    bannerMode,
    accentColor,
    accentCustomColor,
    requireConsent, 
    consentHeading, 
    consentText, 
    consentRequireLocation
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/forms"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">สร้างแบบสอบถามใหม่</h1>
            <p className="text-slate-500">ออกแบบแบบสอบถามตามที่คุณต้องการ</p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-5 h-5" />
            <span className="hidden sm:inline">ดูตัวอย่าง</span>
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving || !code || !title || !slug}
            className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <Edit3 className="w-5 h-5" />
            <span className="hidden sm:inline">บันทึก Draft</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={!isValid || saving}
            className="flex items-center justify-center gap-2 px-4 lg:px-6 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Rocket className="w-5 h-5" />
            {saving ? 'กำลังบันทึก...' : 'Publish v0'}
          </button>
        </div>
      </div>

      {/* Two Column Layout on Large Screens */}
      <div className="w-full space-y-6">
        {/* Form Code - Full Width */}
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Hash className="w-5 h-5 text-blue-600" />
              <label className="text-sm font-medium text-slate-700">
                รหัสแบบสอบถาม (ระบบสร้างอัตโนมัติ)
              </label>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="px-6 py-3 bg-white border border-blue-200 rounded-xl">
                <span className="text-2xl font-mono font-bold text-blue-700">
                  {code || 'กำลังสร้าง...'}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                รหัสนี้จะใช้ในการอ้างอิงและสร้างชื่อ QR Code
              </p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">ข้อมูลพื้นฐาน</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ชื่อแบบสอบถาม <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="เช่น แบบสอบถามความพึงพอใจลูกค้า"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  URL (Slug) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm whitespace-nowrap">/form/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="satisfaction-survey"
                    className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
              
              {/* Logo Section - Before Description */}
              <div>
                {/* Row 1: URL + Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Logo URL - Left (3/4) */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      🖼️ Logo (URL)
                    </label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      แนะนำ: ใช้รูป PNG หรือ SVG พื้นหลังโปร่งใส
                    </p>
                  </div>
                  
                  {/* Logo Preview - Right (1/4) */}
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center">
                    <p className="text-xs text-slate-500 mb-2">ตัวอย่าง:</p>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo preview" className="h-12 object-contain" />
                    ) : (
                      <p className="text-xs text-slate-400">-</p>
                    )}
                  </div>
                </div>
                
                {/* Row 2: Position & Size (when logo exists) */}
                {logoUrl && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* Position */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        ตำแหน่ง
                      </label>
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        {[
                          { value: 'left', label: 'ซ้าย' },
                          { value: 'center', label: 'กลาง' },
                          { value: 'right', label: 'ขวา' },
                        ].map((pos) => (
                          <button
                            key={pos.value}
                            onClick={() => setLogoPosition(pos.value as any)}
                            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                              logoPosition === pos.value
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Size */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        ขนาด
                      </label>
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        {[
                          { value: 'small', label: 'เล็ก' },
                          { value: 'medium', label: 'กลาง' },
                          { value: 'large', label: 'ใหญ่' },
                        ].map((size) => (
                          <button
                            key={size.value}
                            onClick={() => setLogoSize(size.value as any)}
                            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                              logoSize === size.value
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Description - After Logo */}
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  คำอธิบาย
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="คำอธิบายสั้นๆ เกี่ยวกับแบบสอบถาม"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Theme & Color Settings Combined */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎨</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">ธีมและสี</h2>
                <p className="text-sm text-slate-500">ปรับแต่ง Theme และสีของฟอร์ม</p>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-700 mb-3">รูปแบบฟอร์ม (Theme)</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { value: 'default', label: 'มาตรฐาน', desc: 'เรียบง่าย สะอาดตา' },
                  { value: 'card-groups', label: 'การ์ดแยกกลุ่ม', desc: 'แบ่งกลุ่มคำถามเป็นการ์ด' },
                  { value: 'step-wizard', label: 'ขั้นตอน Step', desc: 'แบ่งเป็นขั้นตอน' },
                  { value: 'minimal', label: 'มินิมอล', desc: 'เรียบง่ายที่สุด' },
                ].map((t) => (
                  <label
                    key={t.value}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      theme === t.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={t.value}
                      checked={theme === t.value}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="font-medium text-slate-900">{t.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
                  </label>
                ))}
              </div>
              
              {/* Theme Help Text */}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">โครงสร้างฟอร์ม:</span>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">Section</span> - 
                    {theme === 'card-groups' ? 'เริ่มการ์ดใหม่' : 
                     theme === 'step-wizard' ? 'เริ่มขั้นตอนใหม่' : 
                     'หัวข้อหลัก (ใหญ่)'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">Heading</span> - 
                    หัวข้อย่อยภายใน Section 
                    {theme === 'default' || theme === 'minimal' ? '(เล็กกว่า Section)' : ''}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">คำถามปกติ</span> - มีเลขลำดับ 1, 2, 3...
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 my-6"></div>

            {/* Color Settings */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-4">ตั้งค่าสี</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Banner Color */}
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-3">สี Banner</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setBannerColor('blue')}
                      className={`w-8 h-8 rounded-lg bg-[#2563EB] hover:scale-110 transition-all ${
                        bannerColor === 'blue' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      title="Blue"
                    />
                    <button
                      onClick={() => setBannerColor('black')}
                      className={`w-8 h-8 rounded-lg bg-[#0F172A] hover:scale-110 transition-all ${
                        bannerColor === 'black' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      title="Black"
                    />
                    <button
                      onClick={() => setBannerColor('white')}
                      className={`w-8 h-8 rounded-lg bg-white border-2 border-slate-300 hover:scale-110 transition-all ${
                        bannerColor === 'white' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      title="White"
                    />
                    <button
                      onClick={() => document.getElementById('bannerColorInput')?.click()}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 border-2 border-slate-300 hover:scale-110 transition-all flex items-center justify-center ${
                        bannerColor === 'custom' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      title="Custom"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <input
                      type="color"
                      id="bannerColorInput"
                      className="absolute opacity-0 pointer-events-none"
                      value={bannerCustomColor}
                      onChange={(e) => {
                        setBannerCustomColor(e.target.value);
                        setBannerColor('custom');
                      }}
                    />
                  </div>
                  {bannerColor === 'custom' && (
                    <p className="text-xs text-slate-500 mt-2">สีที่เลือก: {bannerCustomColor}</p>
                  )}
                </div>

                {/* Banner Mode */}
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-3">รูปแบบ Banner</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBannerMode('gradient')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        bannerMode === 'gradient'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Gradient
                    </button>
                    <button
                      onClick={() => setBannerMode('solid')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        bannerMode === 'solid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Solid
                    </button>
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-3">สีรอง (Accent)</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: 'blue', color: '#2563EB' },
                      { key: 'sky', color: '#0EA5E9' },
                      { key: 'teal', color: '#0D9488' },
                      { key: 'emerald', color: '#059669' },
                      { key: 'violet', color: '#7C3AED' },
                      { key: 'rose', color: '#E11D48' },
                      { key: 'orange', color: '#EA580C' },
                      { key: 'slate', color: '#475569' },
                      { key: 'black', color: '#0F172A' },
                    ].map(({ key, color }) => (
                      <button
                        key={key}
                        onClick={() => setAccentColor(key as any)}
                        className={`w-8 h-8 rounded-lg hover:scale-110 transition-all ${
                          accentColor === key ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        title={key}
                      />
                    ))}
                    <button
                      onClick={() => document.getElementById('accentColorInput')?.click()}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 border-2 border-slate-300 hover:scale-110 transition-all flex items-center justify-center ${
                        accentColor === 'custom' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      title="Custom"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <input
                      type="color"
                      id="accentColorInput"
                      className="absolute opacity-0 pointer-events-none"
                      value={accentCustomColor}
                      onChange={(e) => {
                        setAccentCustomColor(e.target.value);
                        setAccentColor('custom');
                      }}
                    />
                  </div>
                  {accentColor === 'custom' && (
                    <p className="text-xs text-slate-500 mt-2">สีที่เลือก: {accentCustomColor}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Consent Settings - Full Width */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">การตั้งค่าความยินยอม (Consent)</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={requireConsent}
                onChange={(e) => setRequireConsent(e.target.checked)}
                className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500 mt-0.5"
              />
              <div>
                <span className="font-medium text-slate-900">ต้องการให้ผู้ตอบกดยินยอมก่อนส่ง</span>
                <p className="text-sm text-slate-500">ผู้ตอบต้องกดยินยอมและระบบจะบันทึก IP, เวลา และตำแหน่ง (ถ้าได้รับอนุญาต)</p>
              </div>
            </label>

            {requireConsent && (
              <div className="ml-0 sm:ml-8 space-y-4">
                {/* Consent Heading */}
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    หัวข้อ Consent
                  </label>
                  <input
                    type="text"
                    value={consentHeading}
                    onChange={(e) => setConsentHeading(e.target.value)}
                    placeholder="เช่น การยินยอม (Consent)"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                {/* Consent Text */}
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ข้อความแสดงความยินยอม
                  </label>
                  <textarea
                    value={consentText}
                    onChange={(e) => setConsentText(e.target.value)}
                    placeholder="เช่น ข้าพเจ้ายินยอมให้เก็บข้อมูลส่วนบุคคล..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
                
                {/* Require Location Option */}
                <label className="flex items-start gap-3 cursor-pointer p-4 bg-white border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={consentRequireLocation}
                    onChange={(e) => setConsentRequireLocation(e.target.checked)}
                    className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500 mt-0.5"
                  />
                  <div>
                    <span className="font-medium text-slate-900">ขอตำแหน่งที่ตั้ง (GPS) จากผู้ตอบ</span>
                    <p className="text-sm text-slate-500">ระบบจะขออนุญาตเข้าถึบตำแหน่ง GPS เมื่อผู้ตอบกดยินยอม</p>
                  </div>
                </label>
                
                <p className="text-xs text-slate-500">
                  💡 ระบบจะบันทึกเสมอ: เวลาที่กดยินยอม, IP Address
                  {consentRequireLocation && ' และตำแหน่ง GPS (ถ้าผู้ใช้อนุญาต)'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form Builder - Full Width */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">คำถาม</h2>
          <FormBuilder fields={fields} onChange={setFields} currentVersion={0} />
        </div>
      </div>

      {/* Full Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-7xl my-4 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-300 p-4 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">ตัวอย่างแบบสอบถาม</h3>
                  <span className="text-xs text-slate-500">ดูตัวอย่างก่อนบันทึก</span>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Full Size Form Preview */}
            <div className="p-8 bg-slate-50 overflow-y-auto">
              <div className="w-full max-w-4xl mx-auto">
                {fields.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white text-center">
                      {logoUrl && (
                        <div className="mb-4">
                          <img src={logoUrl} alt="Logo" className="h-16 mx-auto object-contain" />
                        </div>
                      )}
                      <h1 className="text-2xl font-bold">
                        {title || 'ชื่อแบบสอบถาม'}
                      </h1>
                      {description && (
                        <p className="text-blue-100 mt-3 text-base">{description}</p>
                      )}
                    </div>
                    <div className="p-8">
                      <div className="text-center py-16 text-slate-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">ยังไม่มีคำถาม</p>
                        <p className="text-sm">เพิ่มคำถามจากด้านล่าง</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <FormRenderer
                    form={previewForm}
                    onSubmit={() => {}}
                    submitting={false}
                    submitLabel="ส่งคำตอบ"
                  />
                )}
              </div>

              <div className="text-center mt-8 text-slate-400 text-sm">
                Powered by Questionnaire QR System
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-300 p-4 flex items-center justify-between shrink-0">
              <p className="text-sm text-slate-500">
                {fields.length} คำถาม
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
                >
                  ปิด
                </button>
                <button
                  onClick={() => { setShowPreview(false); handlePublish(); }}
                  disabled={!isValid}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                >
                  Publish v0
                </button>
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
