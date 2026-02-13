'use client';

import { Form, FormField } from '@/types';
import { Shield, MapPin } from 'lucide-react';

interface MinimalThemeProps {
  form: Form;
  errors: Record<string, string>;
  consentChecked: boolean;
  locationStatus: 'idle' | 'requesting' | 'granted' | 'denied';
  onConsentChange: (checked: boolean) => void;
  renderField: (field: FormField) => React.ReactNode;
  renderSubmitButton: () => React.ReactNode;
}

export function MinimalTheme({
  form,
  errors,
  consentChecked,
  locationStatus,
  onConsentChange,
  renderField,
  renderSubmitButton,
}: MinimalThemeProps) {
  return (
    <div className="max-w-xl mx-auto">
      {/* Simple Header */}
      <div className="mb-8 pb-6 border-b border-slate-200">
        {form.logo_url && (
          <img 
            src={form.logo_url} 
            alt="Logo" 
            className="h-10 mb-4 opacity-80"
          />
        )}
        <h1 className="text-xl font-medium text-slate-900 mb-1">
          {form.title || 'แบบสอบถาม'}
        </h1>
        {form.description && (
          <p className="text-sm text-slate-500">{form.description}</p>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-6">
        {form.fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              {field.label}
              {field.required && (
                <span className="text-red-500 ml-0.5">*</span>
              )}
            </label>
            {field.description && (
              <p className="text-xs text-slate-400">{field.description}</p>
            )}
            {renderField(field)}
            {errors[field.id] && (
              <p className="text-xs text-red-500">{errors[field.id]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <hr className="my-8 border-slate-200" />

      {/* Consent */}
      {form.require_consent && (
        <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
          <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            {form.consent_heading || 'การยินยอม'}
          </h4>
          {form.consent_text && (
            <p className="text-xs text-green-700 mb-3 leading-relaxed">
              {form.consent_text}
            </p>
          )}
          <label className="flex items-start gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-green-200">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-green-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-green-800 font-medium">
              ยินยอมตามข้อความข้างต้น
            </span>
          </label>
          {form.consent_require_location && consentChecked && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 ml-6">
              <MapPin className="w-3 h-3" />
              {locationStatus === 'requesting' && 'กำลังขอตำแหน่ง...'}
              {locationStatus === 'granted' && 'ได้รับตำแหน่งแล้ว'}
              {locationStatus === 'denied' && 'ไม่สามารถเข้าถึงตำแหน่งได้'}
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      {renderSubmitButton()}

      {/* Footer Note */}
      <p className="mt-6 text-center text-xs text-slate-400">
        ข้อมูลของคุณจะถูกเก็บเป็นความลับ
      </p>
    </div>
  );
}
