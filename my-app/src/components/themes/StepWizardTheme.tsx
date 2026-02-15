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

// Split fields into steps by section/heading markers
// User controls step breaks by adding 'section' or 'heading' fields
function createSteps(fields: FormField[]): { title: string; fields: FormField[] }[] {
  const steps: { title: string; fields: FormField[] }[] = [];
  let currentStepFields: FormField[] = [];
  let currentStepTitle = 'ข้อมูลพื้นฐาน';

  fields.forEach((field) => {
    // Section or Heading field = start new step with this title
    if (field.type === 'section' || field.type === 'heading') {
      // Save previous step if has fields
      if (currentStepFields.length > 0) {
        steps.push({ title: currentStepTitle, fields: currentStepFields });
        currentStepFields = [];
      }
      // Use this field's label as new step title
      currentStepTitle = field.label || 'หัวข้อใหม่';
      // Don't include section/heading field itself in the step (it's just a marker)
    } else {
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

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-sm">
      {/* Header */}
      <div className={`mb-8 ${
        form.logo_position === 'left' ? 'text-left' : form.logo_position === 'right' ? 'text-right' : 'text-center'
      }`}>
        {form.logo_url && (
          <img 
            src={form.logo_url} 
            alt="Logo" 
            className={`${logoSizeClass} object-contain mb-4 ${
              form.logo_position === 'center' ? 'mx-auto' : form.logo_position === 'right' ? 'ml-auto' : ''
            }`}
          />
        )}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
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
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
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
              <div className="flex items-center gap-3 text-green-600 mb-4">
                <Shield className="w-6 h-6" />
                <h3 className="font-medium text-lg text-green-800">{form.consent_heading || 'การยินยอม'}</h3>
              </div>
              {form.consent_text && (
                <div className="bg-green-50 rounded-lg p-4 text-sm text-green-700 border border-green-200">
                  {form.consent_text}
                </div>
              )}
              <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-green-200 rounded-xl bg-green-50/50 hover:bg-green-100 transition-colors">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => onConsentChange(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-2 border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-green-800 font-medium">
                  ข้าพเจ้าได้อ่านและยินยอมตามข้อความข้างต้น
                </span>
              </label>
              {form.consent_require_location && consentChecked && (
                <div className="flex items-center gap-2 text-sm ml-8 text-green-600">
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
              {steps[currentStep]?.fields.map((field, index) => (
                <div key={field.id} className="space-y-2">
                  <label className="block font-medium text-slate-900">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {field.description && (
                    <p className="text-sm text-slate-500">{field.description}</p>
                  )}
                  {renderField(field)}
                  {errors[field.id] && (
                    <p className="text-sm text-red-500">{errors[field.id]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            ย้อนกลับ
          </button>

          {isLastStep || isConsentStep ? (
            <div className="flex-1 ml-4">
              {renderSubmitButton()}
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ถัดไป
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentStep
                ? 'bg-blue-600 w-6'
                : index < currentStep
                ? 'bg-blue-300'
                : 'bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
