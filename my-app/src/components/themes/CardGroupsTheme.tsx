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

// Group fields by section or heading markers
// User controls grouping by adding "section" or "heading" fields
// Info boxes at the beginning are returned separately
function groupFields(fields: FormField[]): { 
  introBoxes: FormField[];
  groups: { title: string; fields: FormField[] }[] 
} {
  const groups: { title: string; fields: FormField[] }[] = [];
  let currentGroup: FormField[] = [];
  let currentTitle = 'ข้อมูลทั่วไป';
  let foundFirstSection = false;
  const introBoxes: FormField[] = [];

  fields.forEach((field) => {
    // Info boxes before first section are intro boxes
    if (!foundFirstSection && field.type === 'info_box') {
      introBoxes.push(field);
      return;
    }
    
    // Section or Heading field = start new group with this title
    if (field.type === 'section' || field.type === 'heading') {
      foundFirstSection = true;
      // Save previous group if has fields
      if (currentGroup.length > 0) {
        groups.push({ title: currentTitle, fields: currentGroup });
        currentGroup = [];
      }
      // Use this field's label as new group title
      currentTitle = field.label || 'หัวข้อใหม่';
      // Don't include section/heading field itself in the group (it's just a marker)
    } else {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 bg-white rounded-xl p-6 shadow-sm">
      {/* Header Card - Title always centered, logo position independent */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 rounded-2xl p-8 text-white shadow-xl text-center">
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
          <p className="text-blue-100 max-w-xl mx-auto">
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
            {group.fields.map((field, fieldIndex) => (
              <div key={field.id} className="space-y-2">
                <label className="flex items-start gap-2 font-medium text-slate-900">
                  <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded text-xs font-medium flex items-center justify-center">
                    {fieldIndex + 1}
                  </span>
                  <span className="flex-1">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </span>
                </label>
                {field.description && (
                  <p className="text-sm text-slate-500 ml-7">{field.description}</p>
                )}
                <div className="ml-7">
                  {renderField(field)}
                </div>
              </div>
            ))}
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
        {renderSubmitButton()}
      </div>
    </div>
  );
}
