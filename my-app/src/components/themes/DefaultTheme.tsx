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
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-500 p-8 lg:p-10 text-center text-white">
        {form.logo_url ? (
          <>
            <img 
              src={form.logo_url} 
              alt={form.title || 'Logo'} 
              className="h-20 lg:h-24 mx-auto object-contain mb-4"
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
          <p className="text-blue-100 max-w-2xl mx-auto mt-3 text-base lg:text-lg">
            {form.description}
          </p>
        )}
      </div>

      {/* Form Content */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* Calculate question numbers excluding section/heading */}
        {(() => {
          let questionNumber = 0;
          return form.fields.map((field) => {
            // Section/Heading fields render as section headers (no number, no input)
            if (field.type === 'section' || field.type === 'heading') {
              return (
                <div key={field.id} className="pt-4 pb-2 border-b-2 border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {field.label}
                  </h3>
                  {field.description && (
                    <p className="text-sm text-slate-500 mt-1">{field.description}</p>
                  )}
                </div>
              );
            }
            
            // Regular question field
            questionNumber++;
            return (
              <div key={field.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium flex items-center justify-center">
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
                      className="w-5 h-5 mt-0.5 rounded border-2 border-green-300 text-green-600 focus:ring-green-500"
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
          {renderSubmitButton()}
        </div>
      </div>
    </div>
  );
}
