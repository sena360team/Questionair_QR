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

// Get logo size classes
const getLogoSizeClasses = (size?: string) => {
  switch (size) {
    case 'small':
      return 'h-8';
    case 'large':
      return 'h-16';
    case 'medium':
    default:
      return 'h-10';
  }
};

// Get accent color
const getAccentColor = (form: Form) => {
  const colorMap: Record<string, string> = {
    blue: '#2563EB',
    sky: '#0EA5E9',
    teal: '#0D9488',
    emerald: '#059669',
    violet: '#7C3AED',
    rose: '#E11D48',
    orange: '#EA580C',
    slate: '#475569',
    black: '#0F172A',
  };
  
  if (form.accent_color === 'custom' && form.accent_custom_color) {
    return form.accent_custom_color;
  }
  return colorMap[form.accent_color || 'blue'] || '#2563EB';
};

export function MinimalTheme({
  form,
  errors,
  consentChecked,
  locationStatus,
  onConsentChange,
  renderField,
  renderSubmitButton,
}: MinimalThemeProps) {
  const logoSizeClass = getLogoSizeClasses(form.logo_size);
  const accentColor = getAccentColor(form);

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl p-8 shadow-sm">
      {/* Simple Header - Title always left-aligned (minimal style), logo position independent */}
      <div className="mb-8 pb-6 border-b border-slate-200">
        {form.logo_url && (
          <img 
            src={form.logo_url} 
            alt="Logo" 
            className={`${logoSizeClass} mb-4 opacity-80 ${
              form.logo_position === 'center' ? 'mx-auto' : 
              form.logo_position === 'right' ? 'ml-auto' : 
              ''
            }`}
          />
        )}
        <h1 className="text-xl font-medium mb-1" style={{ color: accentColor }}>
          {form.title || 'แบบสอบถาม'}
        </h1>
        {form.description && (
          <p className="text-sm text-slate-500">{form.description}</p>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-6">
        {form.fields.map((field) => {
          // Section field - render as major section header
          if (field.type === 'section') {
            return (
              <div key={field.id} className="pt-4 pb-2">
                <h2 className="text-lg font-semibold text-slate-800">
                  {field.label}
                </h2>
                {(field.helpText || field.description) && (
                  <p className="text-sm text-slate-500 mt-1">{field.helpText || field.description}</p>
                )}
              </div>
            );
          }
          
          // Heading field - render as sub-heading (smaller)
          if (field.type === 'heading') {
            return (
              <div key={field.id} className="pt-4 pb-1">
                <h3 className="text-base font-medium" style={{ color: accentColor }}>
                  {field.label}
                </h3>
                {(field.helpText || field.description) && (
                  <p className="text-sm text-slate-500 mt-1">{field.helpText || field.description}</p>
                )}
              </div>
            );
          }
          
          return (
            <div key={field.id} className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: accentColor }}>
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
          );
        })}
      </div>

      {/* Divider */}
      <hr className="my-8 border-slate-200" />

      {/* Consent - White background with green accents */}
      {form.require_consent && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: accentColor }}>
            <Shield className="w-4 h-4" />
            {form.consent_heading || 'การยินยอม'}
          </h4>
          {form.consent_text && (
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              {form.consent_text}
            </p>
          )}
          <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border transition-colors hover:opacity-90" style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30` }}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded"
              style={{ accentColor: accentColor }}
            />
            <span className="text-sm font-medium" style={{ color: accentColor }}>
              ยินยอมตามข้อความข้างต้น
            </span>
          </label>
          {form.consent_require_location && consentChecked && (
            <div className="mt-2 flex items-center gap-1.5 text-xs ml-6" style={{ color: accentColor }}>
              <MapPin className="w-3 h-3" />
              {locationStatus === 'requesting' && 'กำลังขอตำแหน่ง...'}
              {locationStatus === 'granted' && 'ได้รับตำแหน่งแล้ว'}
              {locationStatus === 'denied' && 'ไม่สามารถเข้าถึงตำแหน่งได้'}
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 px-6 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: accentColor }}
      >
        ส่งคำตอบ
      </button>

      {/* Footer Note */}
      <p className="mt-6 text-center text-xs text-slate-400">
        ข้อมูลของคุณจะถูกเก็บเป็นความลับ
      </p>
    </div>
  );
}
