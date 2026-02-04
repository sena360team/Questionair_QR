'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCode, UTMParams, Project, Form } from '@/types';
import { generateQRCodeDataURL, buildQRRedirectURL, downloadQRCode, generateQRSlug } from '@/lib/qr';
import { cn } from '@/lib/utils';
import { Download, RefreshCw, QrCode as QrIcon, Copy, Check, Building2, MapPin, FileText } from 'lucide-react';
import { useProjects, useForms } from '@/hooks/useSupabase';

interface QRGeneratorProps {
  formSlug: string;
  formId: string;
  existingQR?: QRCode | null;
  onSave?: (qrData: {
    name: string;
    qr_slug: string;
    project_id?: string | null;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  }) => void;
  baseUrl?: string;
}

export function QRGenerator({ 
  formSlug, 
  formId,
  existingQR, 
  onSave,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
}: QRGeneratorProps) {
  const { projects } = useProjects();
  const { forms } = useForms();
  
  // Get current form
  const currentForm = forms.find(f => f.id === formId);
  
  const [name, setName] = useState(existingQR?.name || '');
  const [qrSlug, setQrSlug] = useState(existingQR?.qr_slug || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(existingQR?.project_id || '');
  const [utmSource, setUtmSource] = useState(existingQR?.utm_source || '');
  const [utmMedium, setUtmMedium] = useState(existingQR?.utm_medium || '');
  const [utmCampaign, setUtmCampaign] = useState(existingQR?.utm_campaign || '');
  const [utmContent, setUtmContent] = useState(existingQR?.utm_content || '');
  
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-generate QR name when project selected (if not existing QR)
  useEffect(() => {
    if (selectedProjectId && currentForm && !existingQR) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        // Auto-generate name: FRM-XXX-PROJECT-CODE
        const autoName = `${currentForm.code}-${project.code}`;
        setName(autoName);
        setQrSlug(generateQRSlug(autoName));
        
        // Auto-fill UTM
        setUtmSource(project.name);
        setUtmMedium(project.code);
        setUtmCampaign(currentForm.code);
      }
    }
  }, [selectedProjectId, currentForm, projects, existingQR]);

  const generateQR = useCallback(async () => {
    if (!qrSlug) return;
    setGenerating(true);
    try {
      const utmParams: UTMParams = {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
      };
      const url = buildQRRedirectURL(baseUrl, qrSlug, utmParams);
      const dataUrl = await generateQRCodeDataURL(url, { width: 400 });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR:', error);
    } finally {
      setGenerating(false);
    }
  }, [qrSlug, utmSource, utmMedium, utmCampaign, utmContent, baseUrl]);

  useEffect(() => {
    if (qrSlug) generateQR();
  }, [qrSlug, generateQR]);

  const regenerateSlug = () => {
    setQrSlug(generateQRSlug(name));
  };

  const handleSave = () => {
    onSave?.({
      name,
      qr_slug: qrSlug,
      project_id: selectedProjectId || null,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
    });
  };

  const handleCopyUrl = async () => {
    const utmParams: UTMParams = { utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, utm_content: utmContent };
    const url = buildQRRedirectURL(baseUrl, qrSlug, utmParams);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (qrDataUrl) downloadQRCode(qrDataUrl, `qr-${qrSlug}.png`);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Configuration */}
      <div className="space-y-6">
        {/* Form Info */}
        {currentForm && (
          <div className="bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="text-xs text-slate-500">แบบสอบถาม</span>
                <p className="font-medium text-slate-900">{currentForm.title}</p>
                <span className="text-xs font-mono text-blue-600">{currentForm.code}</span>
              </div>
            </div>
          </div>
        )}

        {/* Project Selection */}
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            เลือกโครงการ (สร้างชื่อ QR อัตโนมัติ)
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- เลือกโครงการ --</option>
            {projects.filter(p => p.is_active).map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
          
          {selectedProject && currentForm && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-100">
              <p className="text-sm text-slate-600 mb-2">
                <span className="font-medium">ชื่อ QR ที่สร้าง:</span>
              </p>
              <p className="font-mono text-lg font-semibold text-blue-700">
                {currentForm.code}-{selectedProject.code}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                รูปแบบ: รหัสแบบสอบถาม + รหัสโครงการ
              </p>
            </div>
          )}
        </div>

        {/* QR Details - Editable */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-900">ข้อมูล QR Code</h3>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              แก้ไขได้
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ชื่อ QR Code *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น FRM-001-BGHBK"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                สามารถแก้ไขได้ตามต้องการ
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">QR Slug *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrSlug}
                  onChange={(e) => setQrSlug(e.target.value)}
                  placeholder="frm-001-bghbk"
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <button
                  onClick={regenerateSlug}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl"
                  title="สร้างใหม่"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* UTM Parameters */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl">
          <h3 className="font-medium text-slate-900 mb-4">พารามิเตอร์ UTM</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">UTM Source (ชื่อโครงการ)</label>
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="กรุณากรอกชื่อโครงการ"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">UTM Medium (รหัสโครงการ)</label>
              <input
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="รหัสโครงการ"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">UTM Campaign (รหัสแบบสอบถาม)</label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="รหัสแบบสอบถาม"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <MapPin className="w-4 h-4" />
                UTM Content (สถานที่/ตำแหน่ง)
              </label>
              <input
                type="text"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                placeholder="เช่น โต๊ะ 5, เคาน์เตอร์ A"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {onSave && (
          <button
            onClick={handleSave}
            disabled={!name || !qrSlug}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {existingQR ? 'บันทึกการเปลี่ยนแปลง' : 'สร้าง QR Code'}
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="space-y-6">
        <div className="bg-white border-2 border-slate-200 rounded-xl p-8 text-center">
          <h3 className="font-medium text-slate-900 mb-6">ตัวอย่าง QR Code</h3>
          
          {qrDataUrl ? (
            <div className="space-y-6">
              <div className="inline-block p-4 bg-white rounded-xl shadow-lg border">
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="space-y-3">
                <button onClick={handleDownload} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800">
                  <Download className="w-5 h-5" />
                  ดาวน์โหลด QR Code
                </button>
                <button onClick={handleCopyUrl} className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50">
                  {copied ? <><Check className="w-5 h-5 text-green-500" /> คัดลอกแล้ว!</> : <><Copy className="w-5 h-5" /> คัดลอกลิงก์</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-slate-400">
              {generating ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-12 h-12 animate-spin" />
                  <p>กำลังสร้าง...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <QrIcon className="w-16 h-16 opacity-50" />
                  <p>เลือกโครงการเพื่อสร้าง QR Code</p>
                </div>
              )}
            </div>
          )}
        </div>

        {qrSlug && (
          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="text-sm font-medium text-slate-700 mb-2">ลิงก์ที่ QR ชี้ไป:</h4>
            <code className="block p-3 bg-slate-100 rounded-lg text-sm break-all font-mono text-slate-600">
              {buildQRRedirectURL(baseUrl, qrSlug, { utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, utm_content: utmContent })}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
