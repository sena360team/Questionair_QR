'use client';

import { useMemo } from 'react';
import { Form, FormField } from '@/types';
import { Shield, MapPin, Layers } from 'lucide-react';

interface CardGroupsThemeProps {
  form: Form;
  consentChecked: boolean;
  locationStatus: 'idle' | 'requesting' | 'granted' | 'denied';
  onConsentChange: (checked: boolean) => void;
  renderField: (field: FormField) => React.ReactNode;
  renderSubmitButton: () => React.ReactNode;
}

// Group fields by section markers only
// Section starts new card, Heading is just a text element inside the card
function groupFields(fields: FormField[]): { 
  introBoxes: FormField[];
  groups: { title: string; fields: (FormField | { type: 'heading_render'; label: string; helpText?: string })[] }[] 
} {
  const groups: { title: string; fields: (FormField | { type: 'heading_render'; label: string; helpText?: string })[] }[] = [];
  let currentGroup: (FormField | { type: 'heading_render'; label: string; helpText?: string })[] = [];
  let currentTitle = 'ข้อมูลทั่วไป';
  let foundFirstSection = false;
  const introBoxes: FormField[] = [];

  fields.forEach((field) => {
    // Info boxes before first section are intro boxes
    if (!foundFirstSection && field.type === 'info_box') {
      introBoxes.push(field);
      return;
    }
    
    // Section field = start new group with this title
    if (field.type === 'section') {
      foundFirstSection = true;
      // Save previous group if has fields
      if (currentGroup.length > 0) {
        groups.push({ title: currentTitle, fields: currentGroup });
        currentGroup = [];
      }
      // Use this field's label as new group title
      currentTitle = field.label || 'หัวข้อใหม่';
      // Don't include section field itself in the group (it's just a marker)
    } 
    // Heading field = render as text element inside current group
    else if (field.type === 'heading') {
      foundFirstSection = true;
      currentGroup.push({ 
        type: 'heading_render', 
        label: field.label || '',
        helpText: field.helpText || field.description
      });
    }
    else {
      currentGroup.push(field);
    }
  });

  // Add remaining fields as last group
  if (currentGroup.length > 0) {
    groups.push({ title: currentTitle, fields: currentGroup });
  }

  return { introBoxes, groups };
}

// Get logo size classes
const getLogoSizeClasses = (size?: string) => {
  switch (size) {
    case 'small':
      return 'h-12';
    case 'large':
      return 'h-24';
    case 'medium':
    default:
      return 'h-16';
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

export function CardGroupsTheme({
  form,
  consentChecked,
  locationStatus,
  onConsentChange,
  renderField,
  renderSubmitButton,
}: CardGroupsThemeProps) {
  const { introBoxes, groups } = useMemo(() => groupFields(form.fields), [form.fields]);
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
    <div className="max-w-5xl mx-auto space-y-6 bg-white rounded-xl p-6 shadow-sm">
      {/* Header Card - Title always centered, logo position independent */}
      <div 
        className={`rounded-2xl p-8 shadow-xl text-center ${isWhiteBanner ? 'text-slate-800 border border-slate-200' : 'text-white'}`}
        style={getBannerStyle()}
      >
        {form.logo_url && (
          <img 
            src={form.logo_url} 
            alt="Logo" 
            className={`${logoSizeClass} object-contain mb-4 ${
              form.logo_position === 'center' ? 'mx-auto' : 
              form.logo_position === 'right' ? 'ml-auto' : 
              'mr-auto'
            }`}
          />
        )}
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          {form.title || 'แบบสอบถาม'}
        </h1>
        {form.description && (
          <p className={`max-w-xl mx-auto ${isWhiteBanner ? 'text-slate-600' : 'text-white/80'}`}>
            {form.description}
          </p>
        )}
      </div>

      {/* Intro Info Boxes (before first section) - no card border */}
      {introBoxes.length > 0 && (
        <div className="space-y-4">
          {introBoxes.map((field) => (
            <div key={field.id} className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              {field.label && (
                <h4 className="font-medium text-blue-900 mb-2">{field.label}</h4>
              )}
              {(field.helpText || field.description) && (
                <div className="text-sm text-blue-700 whitespace-pre-wrap">
                  {field.helpText || field.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Field Groups */}
      {groups.map((group, groupIndex) => (
        <div 
          key={groupIndex} 
          className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Group Header */}
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              {group.title}
            </span>
            <span className="ml-auto text-xs text-slate-400">
              {groupIndex + 1}/{groups.length}
            </span>
          </div>

          {/* Group Fields */}
          <div className="p-6 space-y-5">
            {(() => {
              let questionNumber = 0;
              return group.fields.map((field, fieldIndex) => {
                // Heading render
                if ('type' in field && field.type === 'heading_render') {
                  return (
                    <div key={`heading-${fieldIndex}`} className="space-y-1">
                      <h3 className="text-base font-semibold" style={{ color: accentColor }}>
                        {field.label}
                      </h3>
                      {field.helpText && (
                        <p className="text-sm text-slate-500">{field.helpText}</p>
                      )}
                    </div>
                  );
                }
                
                // Regular field
                const regularField = field as FormField;
                questionNumber++;
                return (
                  <div key={regularField.id} className="space-y-2">
                    <label className="flex items-start gap-2 font-medium text-slate-900">
                      <span 
                        className="flex-shrink-0 w-5 h-5 rounded text-xs font-medium flex items-center justify-center text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {questionNumber}
                      </span>
                      <span className="flex-1">
                        {regularField.label}
                        {regularField.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                    </label>
                    {regularField.description && (
                      <p className="text-sm text-slate-500 ml-7">{regularField.description}</p>
                    )}
                    <div className="ml-7">
                      {renderField(regularField)}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ))}

      {/* Consent Card - White background with green accents */}
      {form.require_consent && (
        <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-slate-900">
                {form.consent_heading || 'การยินยอม'}
              </h4>
            </div>
          </div>
          <div className="p-6">
            {form.consent_text && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4 text-sm text-slate-700 border border-slate-200">
                {form.consent_text}
              </div>
            )}
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-green-50 rounded-lg border border-green-200">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => onConsentChange(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-2 border-green-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-green-800 font-medium">
                ข้าพเจ้าได้อ่านและยินยอมตามข้อความข้างต้น
              </span>
            </label>
            {form.consent_require_location && consentChecked && (
              <div className="mt-3 flex items-center gap-2 text-sm ml-8 text-green-600">
                <MapPin className="w-4 h-4" />
                {locationStatus === 'requesting' && 'กำลังขอตำแหน่ง...'}
                {locationStatus === 'granted' && 'ได้รับตำแหน่งแล้ว'}
                {locationStatus === 'denied' && 'ไม่สามารถเข้าถึงตำแหน่งได้'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-3 px-6 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: accentColor }}
        >
          ส่งคำตอบ
        </button>
      </div>
    </div>
  );
}
