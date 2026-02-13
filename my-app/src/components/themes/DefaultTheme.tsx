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

export function DefaultTheme({
  form,
  consentChecked,
  locationStatus,
  onConsentChange,
  renderField,
  renderSubmitButton,
}: DefaultThemeProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-500 p-6 lg:p-8 text-center text-white">
        {form.logo_url && (
          <img 
            src={form.logo_url} 
            alt="Logo" 
            className="h-16 lg:h-20 mx-auto object-contain mb-4"
          />
        )}
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          {form.title || 'แบบสอบถาม'}
        </h1>
        {form.description && (
          <p className="text-blue-100 max-w-2xl mx-auto">
            {form.description}
          </p>
        )}
      </div>

      {/* Form Content */}
      <div className="p-6 lg:p-8 space-y-6">
        {form.fields.map((field, index) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium flex items-center justify-center">
                {index + 1}
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
        ))}

        {/* Consent Section */}
        {form.require_consent && (
          <div className="border-t pt-6 mt-6">
            <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 mb-2">
                    {form.consent_heading || 'การยินยอม'}
                  </h4>
                  {form.consent_text && (
                    <p className="text-sm text-slate-600 mb-4 whitespace-pre-line">
                      {form.consent_text}
                    </p>
                  )}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => onConsentChange(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
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
          {renderSubmitButton()}
        </div>
      </div>
    </div>
  );
}
