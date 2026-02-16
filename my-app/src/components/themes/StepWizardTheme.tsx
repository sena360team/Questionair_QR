'use client';

import { useState, useMemo } from 'react';
import { Form, FormField } from '@/types';
import { Shield, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface StepWizardThemeProps {
  form: Form;
  errors: Record<string, string>;
  consentChecked: boolean;
  locationStatus: 'idle' | 'requesting' | 'granted' | 'denied';
  onConsentChange: (checked: boolean) => void;
  renderField: (field: FormField) => React.ReactNode;
  renderSubmitButton: () => React.ReactNode;
}

// Split fields into steps
// Info Box fields go to Welcome step first
// Section fields start new steps
// Heading is just a text element inside the step
function createSteps(fields: FormField[]): { title: string; isWelcome?: boolean; fields: (FormField | { type: 'heading_render'; label: string; helpText?: string })[] }[] {
  const steps: { title: string; isWelcome?: boolean; fields: (FormField | { type: 'heading_render'; label: string; helpText?: string })[] }[] = [];
  
  // Step 1: Extract Info Box fields as Welcome step
  const infoBoxFields: (FormField | { type: 'heading_render'; label: string; helpText?: string })[] = [];
  const remainingFields: FormField[] = [];
  
  fields.forEach((field) => {
    if (field.type === 'info_box') {
      infoBoxFields.push(field);
    } else {
      remainingFields.push(field);
    }
  });
  
  // Add Welcome step if there are Info Box fields
  if (infoBoxFields.length > 0) {
    steps.push({ title: 'ยินดีต้อนรับ', isWelcome: true, fields: infoBoxFields });
  }
  
  // Create steps from remaining fields (sections, headings, questions)
  let currentStepFields: (FormField | { type: 'heading_render'; label: string; helpText?: string })[] = [];
  let currentStepTitle = 'เริ่มต้น';

  remainingFields.forEach((field) => {
    // Section field = start new step with this title
    if (field.type === 'section') {
      // Save previous step if has fields
      if (currentStepFields.length > 0) {
        steps.push({ title: currentStepTitle, fields: currentStepFields });
        currentStepFields = [];
      }
      // Use this field's label as new step title
      currentStepTitle = field.label || 'หัวข้อใหม่';
      // Don't include section field itself in the step (it's just a marker)
    } 
    // Heading field = render as text element inside current step
    else if (field.type === 'heading') {
      currentStepFields.push({ 
        type: 'heading_render', 
        label: field.label || '',
        helpText: field.helpText || field.description
      });
    }
    else {
      currentStepFields.push(field);
    }
  });

  // Add remaining fields as last step
  if (currentStepFields.length > 0) {
    steps.push({ title: currentStepTitle, fields: currentStepFields });
  }

  return steps;
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

export function StepWizardTheme({
  form,
  errors,
  consentChecked,
  locationStatus,
  onConsentChange,
  renderField,
  renderSubmitButton,
}: StepWizardThemeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = useMemo(() => createSteps(form.fields), [form.fields]);
  const totalSteps = steps.length + (form.require_consent ? 1 : 0);
  const isLastStep = currentStep === steps.length - 1 && !form.require_consent;
  const isConsentStep = form.require_consent && currentStep === steps.length;
  const logoSizeClass = getLogoSizeClasses(form.logo_size);
  const accentColor = getAccentColor(form);
  const lighterAccent = adjustBrightness(accentColor, 20);

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl p-8 shadow-sm">
      {/* Header - Title always centered, logo position independent */}
      <div className="mb-8 text-center">
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
        <h1 className="text-2xl font-bold mb-2" style={{ color: accentColor }}>
          {form.title || 'แบบสอบถาม'}
        </h1>
        {form.description && (
          <p className="text-slate-500">{form.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">
            ขั้นตอน {currentStep + 1} จาก {totalSteps}
          </span>
          <span className="text-sm text-slate-400">
            {Math.round(((currentStep + 1) / totalSteps) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${((currentStep + 1) / totalSteps) * 100}%`,
              background: `linear-gradient(to right, ${accentColor}, ${lighterAccent})`
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden min-h-[300px]">
        {/* Step Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">
            {isConsentStep ? 'การยินยอม' : steps[currentStep]?.title}
          </h2>
        </div>

        {/* Step Body */}
        <div className="p-6">
          {isConsentStep ? (
            // Consent Step
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6" style={{ color: accentColor }} />
                <h3 className="font-medium text-lg text-slate-800">{form.consent_heading || 'การยินยอม'}</h3>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 border border-slate-200">
                {form.consent_text || (
                  <div className="space-y-2">
                    <p className="font-medium">ข้อตกลงการใช้งาน</p>
                    <p>กรุณาอ่านและยินยอมข้อตกลงก่อนดำเนินการต่อ</p>
                    <p className="text-xs text-slate-500 mt-2">หมายเหตุ: ผู้สร้างฟอร์มยังไม่ได้ระบุรายละเอียดการยินยอม</p>
                  </div>
                )}
              </div>
              <label className="flex items-start gap-3 cursor-pointer p-4 border-2 rounded-xl hover:bg-slate-50 transition-colors" style={{ borderColor: accentColor }}>
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => onConsentChange(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-2"
                  style={{ accentColor: accentColor }}
                />
                <span className="font-medium" style={{ color: accentColor }}>
                  ข้าพเจ้าได้อ่านและยินยอมตามข้อความข้างต้น
                </span>
              </label>
              {form.consent_require_location && consentChecked && (
                <div className="flex items-center gap-2 text-sm ml-8" style={{ color: accentColor }}>
                  <MapPin className="w-4 h-4" />
                  {locationStatus === 'requesting' && 'กำลังขอตำแหน่ง...'}
                  {locationStatus === 'granted' && 'ได้รับตำแหน่งแล้ว'}
                  {locationStatus === 'denied' && 'ไม่สามารถเข้าถึงตำแหน่งได้'}
                </div>
              )}
            </div>
          ) : (
            // Field Step
            <div className="space-y-6">
              {steps[currentStep]?.fields.map((field, index) => {
                // Heading render
                if ('type' in field && field.type === 'heading_render') {
                  return (
                    <div key={`heading-${index}`} className="space-y-1">
                      <h3 className="text-base font-semibold" style={{ color: accentColor }}>
                        {field.label}
                      </h3>
                      {field.helpText && (
                        <p className="text-sm text-slate-500">{field.helpText}</p>
                      )}
                    </div>
                  );
                }
                
                // Info Box field
                const regularField = field as FormField;
                if (regularField.type === 'info_box') {
                  return (
                    <div key={regularField.id} className="border-l-4 border-slate-300 bg-slate-50 rounded-r-xl p-6 my-4">
                      {regularField.label && (
                        <h4 className="text-lg font-semibold text-slate-900 mb-3">{regularField.label}</h4>
                      )}
                      {regularField.description && (
                        <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                          {regularField.description}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Regular field
                return (
                  <div key={regularField.id} className="space-y-2">
                    <label className="block font-medium text-slate-900">
                      {regularField.label}
                      {regularField.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {regularField.description && (
                      <p className="text-sm text-slate-500">{regularField.description}</p>
                    )}
                    {renderField(regularField)}
                    {errors[regularField.id] && (
                      <p className="text-sm text-red-500">{errors[regularField.id]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            ย้อนกลับ
          </button>

          {/* Next/Submit Button */}
          {steps[currentStep]?.isWelcome || (!isLastStep && !isConsentStep) ? (
            // Not last step - show Next button
            <button
              type="button"
              onClick={(e) => handleNext(e)}
              className="flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              {steps[currentStep]?.isWelcome ? (
                <>
                  เริ่มต้น
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  ถัดไป
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : isConsentStep ? (
            // Consent step - show custom submit button
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              ส่งคำตอบ
            </button>
          ) : (
            // Last step - use renderSubmitButton from FormRenderer
            renderSubmitButton()
          )}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentStep(index)}
            className="h-2.5 rounded-full transition-all"
            style={{
              width: index === currentStep ? '1.5rem' : '0.625rem',
              backgroundColor: index === currentStep ? accentColor : index < currentStep ? lighterAccent : '#cbd5e1'
            }}
          />
        ))}
      </div>
    </div>
  );
}
