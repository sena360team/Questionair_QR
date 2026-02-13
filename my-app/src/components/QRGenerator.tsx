'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { QRCode, UTMParams, Project, Form } from '@/types';
import { generateQRCodeDataURL, buildQRRedirectURL, downloadQRCode, generateQRSlug } from '@/lib/qr';
import { cn } from '@/lib/utils';
import { Download, RefreshCw, QrCode as QrIcon, Copy, Check, Building2, MapPin, FileText, AlertTriangle, X } from 'lucide-react';
import { useProjects, useForms } from '@/hooks/useSupabase';

interface QRGeneratorProps {
  formSlug: string;
  formId: string;
  existingQR?: QRCode | null;
  existingQRCodes?: QRCode[]; // For duplicate checking
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
  existingQRCodes = [],
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
  
  // Confirm dialog state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState<'duplicate-project' | 'duplicate-slug'>('duplicate-project');
  
  // Check if this form + project combination already has a QR code
  const existingQRForProject = useMemo(() => {
    if (!selectedProjectId || existingQR) return null;
    return existingQRCodes.find(qr => 
      qr.form_id === formId && qr.project_id === selectedProjectId
    );
  }, [selectedProjectId, formId, existingQRCodes, existingQR]);
  
  const hasExistingQRForProject = !!existingQRForProject;
  
  // Also check for duplicate QR slug
  const isDuplicateSlug = useMemo(() => {
    if (!qrSlug || existingQR) return false;
    return existingQRCodes.some(qr => 
      qr.qr_slug.toLowerCase() === qrSlug.toLowerCase()
    );
  }, [qrSlug, existingQRCodes, existingQR]);

  // Auto-generate QR name when project selected (if not existing QR)
  useEffect(() => {
    if (selectedProjectId && currentForm && !existingQR) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        // Auto-generate name: FRM-XXX-PROJECT-CODE
        const autoName = `${currentForm.code}-${project.code}`;
        setName(autoName);
        const newQrSlug = generateQRSlug(autoName);
        setQrSlug(newQrSlug);
        
        // Auto-fill UTM - ใช้ qr_slug เป็น utm_content เพื่อให้ระบบ track ได้
        setUtmSource(project.name);
        setUtmMedium(project.code);
        setUtmCampaign(currentForm.code);
        setUtmContent(newQrSlug); // ใช้ qr_slug เป็น utm_content
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
      console.log('🔍 QR URL generated:', url);
      console.log('🔍 Base URL:', baseUrl);
      console.log('🔍 QR Slug:', qrSlug);
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
    // Check if confirmation needed
    if (hasExistingQRForProject && !existingQR) {
      setConfirmType('duplicate-project');
      setShowConfirm(true);
      return;
    }
    
    if (isDuplicateSlug && !existingQR && !hasExistingQRForProject) {
      setConfirmType('duplicate-slug');
      setShowConfirm(true);
      return;
    }
    
    // No confirmation needed, save directly
    doSave();
  };
  
  const doSave = () => {
    onSave?.({
      name,
      qr_slug: qrSlug,
      project_id: selectedProjectId || null,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
    });
    setShowConfirm(false);
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
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
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
          
          {/* Alert: Existing QR for this project */}
          {hasExistingQRForProject && existingQRForProject && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700">
                    โครงการนี้มี QR Code แล้ว
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    รหัส: <span className="font-mono font-medium">{existingQRForProject.qr_slug}</span>
                  </p>
                  <p className="text-xs text-red-500 mt-2">
                    หากสร้าง QR Code เพิ่ม จะมีหลาย QR Code สำหรับโครงการเดียวกัน
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* QR Details - Editable */}
        <div className="bg-white border-2 border-slate-300 p-5 rounded-xl">
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
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
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
                  className={cn(
                    "flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 font-mono text-sm",
                    isDuplicateSlug || hasExistingQRForProject
                      ? "border-amber-300 focus:ring-amber-500 focus:border-amber-500 bg-amber-50" 
                      : "border-slate-300 focus:ring-blue-500"
                  )}
                />
                <button
                  onClick={regenerateSlug}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 border-2 border-slate-300 rounded-xl"
                  title="สร้างใหม่"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              {/* Duplicate Warning */}
              {isDuplicateSlug && !hasExistingQRForProject && (
                <div className="mt-2 flex items-start gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">รหัส QR นี้มีในระบบแล้ว</p>
                    <p className="text-amber-500 text-xs mt-0.5">
                      หากบันทึกจะสร้าง QR ซ้ำ กรุณาเปลี่ยนรหัสหรือกด "สร้างใหม่"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* UTM Parameters */}
        <div className="bg-white border-2 border-slate-300 p-5 rounded-xl">
          <h3 className="font-medium text-slate-900 mb-4">พารามิเตอร์ UTM</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">UTM Source (ชื่อโครงการ)</label>
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="กรุณากรอกชื่อโครงการ"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">UTM Medium (รหัสโครงการ)</label>
              <input
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="รหัสโครงการ"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">UTM Campaign (รหัสแบบสอบถาม)</label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="รหัสแบบสอบถาม"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
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
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {onSave && (
          <button
            onClick={handleSave}
            disabled={!name || !qrSlug}
            className={cn(
              "w-full py-3 rounded-xl font-medium disabled:opacity-50 transition-colors",
              hasExistingQRForProject
                ? "bg-red-500 text-white hover:bg-red-600"
                : isDuplicateSlug
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {existingQR 
              ? 'บันทึกการเปลี่ยนแปลง' 
              : hasExistingQRForProject 
                ? 'สร้าง QR Code (มีโครงการนี้แล้ว)'
                : isDuplicateSlug 
                  ? 'สร้าง QR Code (ซ้ำ)'
                  : 'สร้าง QR Code'
            }
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="space-y-6">
        <div className="bg-white border-2 border-slate-300 rounded-xl p-8 text-center">
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
                <button onClick={handleCopyUrl} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
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
      
      {/* Custom Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                confirmType === 'duplicate-project' ? "bg-red-100" : "bg-amber-100"
              )}>
                <AlertTriangle className={cn(
                  "w-6 h-6",
                  confirmType === 'duplicate-project' ? "text-red-600" : "text-amber-600"
                )} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {confirmType === 'duplicate-project' 
                    ? 'โครงการนี้มี QR Code แล้ว' 
                    : 'รหัส QR ซ้ำในระบบ'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {confirmType === 'duplicate-project'
                    ? `โครงการ "${selectedProject?.name}" เคยสร้าง QR Code ไปแล้ว`
                    : `รหัส "${qrSlug}" มีในระบบแล้ว`}
                </p>
              </div>
            </div>
            
            {/* Details */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
              {confirmType === 'duplicate-project' && existingQRForProject && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">รหัสเดิม:</span>
                    <code className="font-mono text-slate-700">{existingQRForProject.qr_slug}</code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">รหัสใหม่:</span>
                    <code className="font-mono text-blue-600">{qrSlug}</code>
                  </div>
                </>
              )}
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-200">
                {confirmType === 'duplicate-project'
                  ? 'การสร้าง QR Code เพิ่มจะทำให้มีหลาย QR สำหรับโครงการเดียวกัน'
                  : 'การสร้าง QR Code ซ้ำอาจทำให้สับสนในการติดตาม'}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={doSave}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium text-white transition-colors",
                  confirmType === 'duplicate-project'
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-amber-500 hover:bg-amber-600"
                )}
              >
                {confirmType === 'duplicate-project' ? 'สร้างเพิ่ม' : 'สร้างซ้ำ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
