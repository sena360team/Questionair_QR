'use client';

import { Form, FormField } from '@/types';
import { Shield, MapPin } from 'lucide-react';

interface DefaultThemeProps {
  form: Form;
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
      return 'h-12 lg:h-16';
    case 'large':
      return 'h-28 lg:h-32';
    case 'medium':
    default:
      return 'h-20 lg:h-24';
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

export function DefaultTheme({
  form,
  consentChecked,
  locationStatus,
  onConsentChange,
  renderField,
  renderSubmitButton,
}: DefaultThemeProps) {
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
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      {/* Header - with custom color */}
      <div 
        className={`p-8 lg:p-10 text-center ${isWhiteBanner ? 'text-slate-800 border-b border-slate-200' : 'text-white'}`}
        style={getBannerStyle()}
      >
        {form.logo_url ? (
          <>
            <img 
              src={form.logo_url} 
              alt={form.title || 'Logo'} 
              className={`${logoSizeClass} object-contain mb-4 ${
                form.logo_position === 'center' ? 'mx-auto' : 
                form.logo_position === 'right' ? 'ml-auto' : 
                'mr-auto'
              }`}
            />
            <h1 className="text-xl lg:text-2xl font-bold">
              {form.title}
            </h1>
          </>
        ) : (
          <h1 className="text-3xl lg:text-4xl font-bold">
            {form.title || 'แบบสอบถาม'}
          </h1>
        )}
        {form.description && (
          <p className={`max-w-2xl mx-auto mt-3 text-base lg:text-lg ${isWhiteBanner ? 'text-slate-600' : 'text-white/80'}`}>
            {form.description}
          </p>
        )}
      </div>

      {/* Form Content */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* Calculate question numbers excluding section/heading/info_box */}
        {(() => {
          let questionNumber = 0;
          return form.fields.map((field) => {
            // Section field - render as major section header
            if (field.type === 'section') {
              return (
                <div key={field.id} className="pt-4 pb-2">
                  <h2 className="text-xl font-bold text-slate-800">
                    {field.label}
                  </h2>
                  {(field.helpText || field.description) && (
                    <p className="text-sm text-slate-500 mt-1">{field.helpText || field.description}</p>
                  )}
                </div>
              );
            }
            
            // Heading field - render as sub-heading (smaller, no border)
            if (field.type === 'heading') {
              return (
                <div key={field.id} className="pt-4 pb-1">
                  <h3 className="text-lg font-semibold" style={{ color: accentColor }}>
                    {field.label}
                  </h3>
                  {(field.helpText || field.description) && (
                    <p className="text-sm text-slate-500 mt-1">{field.helpText || field.description}</p>
                  )}
                </div>
              );
            }
            
            // Info box - render without number but show content
            if (field.type === 'info_box') {
              return (
                <div key={field.id} className="ml-8">
                  {renderField(field)}
                </div>
              );
            }
            
            // Regular question field
            questionNumber++;
            return (
              <div key={field.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span 
                    className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {questionNumber}
                  </span>
                  <label className="flex-1 font-medium text-slate-900">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                </div>
                {field.description && (
                  <p className="text-sm text-slate-500 ml-8">{field.description}</p>
                )}
                <div className="ml-8">
                  {renderField(field)}
                </div>
              </div>
            );
          });
        })()}

        {/* Consent Section */}
        {form.require_consent && (
          <div className="border-t border-green-200 pt-6 mt-6">
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900 mb-2">
                    {form.consent_heading || 'การยินยอม'}
                  </h4>
                  {form.consent_text && (
                    <p className="text-sm text-green-700 mb-4 whitespace-pre-line">
                      {form.consent_text}
                    </p>
                  )}
                  <label className="flex items-start gap-3 cursor-pointer bg-white p-3 rounded-lg border border-green-200">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => onConsentChange(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-2 border-green-300"
                      style={{ accentColor: accentColor }}
                    />
                    <span className="text-sm text-green-800 font-medium">
                      ข้าพเจ้าได้อ่านและยินยอมตามข้อความข้างต้น
                    </span>
                  </label>
                  {form.consent_require_location && consentChecked && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      {locationStatus === 'requesting' && (
                        <span className="text-slate-500">กำลังขอตำแหน่ง...</span>
                      )}
                      {locationStatus === 'granted' && (
                        <span className="text-green-600">ได้รับตำแหน่งแล้ว</span>
                      )}
                      {locationStatus === 'denied' && (
                        <span className="text-amber-600">ไม่สามารถเข้าถึงตำแหน่งได้</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-3 px-6 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
          >
            ส่งคำตอบ
          </button>
        </div>
      </div>
    </div>
  );
}
