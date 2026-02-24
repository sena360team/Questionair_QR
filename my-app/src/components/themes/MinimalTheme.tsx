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

// Get banner color
const getBannerColor = (form: Form) => {
  const colorMap: Record<string, string> = {
    blue: '#2563EB',
    black: '#0F172A',
    white: '#FFFFFF',
  };
  
  if (form.banner_color === 'custom' && form.banner_custom_color) {
    return form.banner_custom_color;
  }
  return colorMap[form.banner_color || 'blue'] || '#2563EB';
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

// Adjust brightness for gradient
const adjustBrightness = (hex: string, percent: number) => {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  r = Math.min(255, Math.max(0, r + (r * percent / 100)));
  g = Math.min(255, Math.max(0, g + (g * percent / 100)));
  b = Math.min(255, Math.max(0, b + (b * percent / 100)));
  
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
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
  const bannerColor = getBannerColor(form);
  const accentColor = getAccentColor(form);
  const bannerMode = form.banner_mode || 'gradient';
  const isWhiteBanner = bannerColor.toLowerCase() === '#ffffff';
  
  // Generate banner style
  const getBannerStyle = () => {
    if (bannerMode === 'solid') {
      return { backgroundColor: bannerColor };
    }
    // Gradient mode
    const lighterColor = adjustBrightness(bannerColor, 20);
    return {
      background: `linear-gradient(135deg, ${bannerColor} 0%, ${lighterColor} 100%)`,
    };
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Header - with custom banner color */}
      <div 
        className={`p-8 ${isWhiteBanner ? 'text-slate-800 border-b border-slate-200' : 'text-white'}`}
        style={getBannerStyle()}
      >
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
        <h1 className={`text-xl font-medium mb-1 ${isWhiteBanner ? 'text-slate-900' : ''}`}>
          {form.title || 'แบบสอบถาม'}
        </h1>
        {form.description && (
          <p className={`text-sm ${isWhiteBanner ? 'text-slate-600' : 'text-white/80'}`}>
            {form.description}
          </p>
        )}
      </div>

      {/* Fields */}
      <div className="p-8 space-y-6">
        {form.fields.map((field) => {
          // Section field - render as major section header
          if (field.type === 'section') {
            return (
              <div key={field.id} className="pt-4 pb-2">
                <h2 className="text-lg font-semibold text-slate-800">
                  {field.label}
                </h2>
                {(field.helpText || field.helpText) && (
                  <p className="text-sm text-slate-500 mt-1">{field.helpText || field.helpText}</p>
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
                {(field.helpText || field.helpText) && (
                  <p className="text-sm text-slate-500 mt-1">{field.helpText || field.helpText}</p>
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
              {field.helpText && (
                <p className="text-xs text-slate-400">{field.helpText}</p>
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
