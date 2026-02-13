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

// Group fields by section or type
function groupFields(fields: FormField[]): { title: string; fields: FormField[] }[] {
  const groups: { title: string; fields: FormField[] }[] = [];
  let currentGroup: FormField[] = [];
  let currentTitle = 'ข้อมูลทั่วไป';

  fields.forEach((field, index) => {
    // Start new group on certain field types or every 3-4 fields
    if (field.type === 'rating' || field.type === 'nps' || field.type === 'scale') {
      if (currentGroup.length > 0) {
        groups.push({ title: currentTitle, fields: currentGroup });
        currentGroup = [];
      }
      currentTitle = 'แบบประเมิน';
      currentGroup.push(field);
    } else if (field.type === 'checkbox' && field.options && field.options.length > 4) {
      if (currentGroup.length > 0) {
        groups.push({ title: currentTitle, fields: currentGroup });
        currentGroup = [];
      }
      currentTitle = 'ตัวเลือก';
      currentGroup.push(field);
    } else {
      currentGroup.push(field);
      // Auto split every 3-4 fields
      if (currentGroup.length >= 4) {
        groups.push({ title: currentTitle, fields: currentGroup });
        currentGroup = [];
        currentTitle = 'ข้อมูลเพิ่มเติม';
      }
    }
  });

  if (currentGroup.length > 0) {
    groups.push({ title: currentTitle, fields: currentGroup });
  }

  return groups;
}

export function CardGroupsTheme({
  form,
  consentChecked,
  locationStatus,
  onConsentChange,
  renderField,
  renderSubmitButton,
}: CardGroupsThemeProps) {
  const groups = useMemo(() => groupFields(form.fields), [form.fields]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 rounded-2xl p-8 text-white shadow-xl">
        {form.logo_url && (
          <img 
            src={form.logo_url} 
            alt="Logo" 
            className="h-16 mx-auto object-contain mb-4 bg-white/20 rounded-xl p-2"
          />
        )}
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-center">
          {form.title || 'แบบสอบถาม'}
        </h1>
        {form.description && (
          <p className="text-blue-100 text-center max-w-xl mx-auto">
            {form.description}
          </p>
        )}
      </div>

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

      {/* Consent Card */}
      {form.require_consent && (
        <div className="bg-amber-50 rounded-xl shadow-md border-2 border-amber-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200 bg-amber-100/50">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <h4 className="font-medium text-amber-900">
                {form.consent_heading || 'การยินยอม'}
              </h4>
            </div>
          </div>
          <div className="p-6">
            {form.consent_text && (
              <div className="bg-white rounded-lg p-4 mb-4 text-sm text-slate-700 border border-amber-200">
                {form.consent_text}
              </div>
            )}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => onConsentChange(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-2 border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-slate-700">
                ข้าพเจ้าได้อ่านและยินยอมตามข้อความข้างต้น
              </span>
            </label>
            {form.consent_require_location && consentChecked && (
              <div className="mt-3 flex items-center gap-2 text-sm ml-8">
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
      )}

      {/* Submit */}
      <div className="pt-2">
        {renderSubmitButton()}
      </div>
    </div>
  );
}
