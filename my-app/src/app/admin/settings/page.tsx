'use client';

import { useState, useEffect } from 'react';
import { Settings, Code, Database, Shield, Save, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'api-css' | 'general' | 'security';

interface CSSConfig {
  apiKey: string;
  contactChannelId: string;
  userCreated: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('api-css');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // CSS API Config
  const [cssConfig, setCssConfig] = useState<CSSConfig>({
    apiKey: '',
    contactChannelId: '',
    userCreated: '',
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/css');
      if (res.ok) {
        const data = await res.json();
        setCssConfig({
          apiKey: data.apiKey || '',
          contactChannelId: data.contactChannelId || '',
          userCreated: data.userCreated || '',
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCSS = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings/css', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: cssConfig.apiKey.trim(),
          contactChannelId: cssConfig.contactChannelId.trim(),
          userCreated: cssConfig.userCreated.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          <button
            onClick={() => setActiveTab('api-css')}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'api-css'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Code className="w-4 h-4" />
            API TO CSS
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'general'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Database className="w-4 h-4" />
            ทั่วไป
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'security'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Shield className="w-4 h-4" />
            ความปลอดภัย
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-6">
        {activeTab === 'api-css' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">การเชื่อมต่อระบบ CSS</h2>
              <p className="text-sm text-slate-500 mt-1">
                ตั้งค่าการเชื่อมต่อ API ไปยังระบบ CSS (Complaint Service System)
              </p>
            </div>

            {/* Endpoint Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700">
                Endpoint: https://api-css.senxgroup.com/api/complaint-list/create-by-other
              </p>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={cssConfig.apiKey}
                onChange={(e) => setCssConfig({ ...cssConfig, apiKey: e.target.value })}
                placeholder="กรอก API Key จากระบบ CSS"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                API Key สำหรับเชื่อมต่อกับระบบ CSS (Authorization Bearer)
              </p>
            </div>

            {/* Contact Channel ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Channel ID
              </label>
              <input
                type="text"
                value={cssConfig.contactChannelId}
                onChange={(e) => setCssConfig({ ...cssConfig, contactChannelId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                รหัสช่องทางการติดต่อในระบบ CSS
              </p>
            </div>

            {/* User Created ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                User Created ID
              </label>
              <input
                type="text"
                value={cssConfig.userCreated}
                onChange={(e) => setCssConfig({ ...cssConfig, userCreated: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                รหัสผู้ใช้ที่สร้างรายการในระบบ CSS
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
              <button
                onClick={handleSaveCSS}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                  isSaving
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    บันทึกการตั้งค่า
                  </>
                )}
              </button>

              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">บันทึกสำเร็จ</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="text-center py-12 text-slate-500">
            <Database className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>การตั้งค่าทั่วไปจะเพิ่มในอนาคต</p>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="text-center py-12 text-slate-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>การตั้งค่าความปลอดภัยจะเพิ่มในอนาคต</p>
          </div>
        )}
      </div>
    </div>
  );
}
