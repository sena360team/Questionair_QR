'use client';

import { useState, useEffect, useCallback } from 'react';
import { Form, FormField, FieldType } from '@/types';
import { cn, isValidEmail } from '@/lib/utils';
import { Star, Check, Shield, MapPin } from 'lucide-react';

interface FormRendererProps {
  form: Form;
  onSubmit: (responses: Record<string, unknown>) => void;
  submitting?: boolean;
  submitLabel?: string;
}

export function FormRenderer({ 
  form, 
  onSubmit, 
  submitting = false,
  submitLabel = 'ส่งคำตอบ'
}: FormRendererProps) {
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  
  // Consent State
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentLocation, setConsentLocation] = useState<{latitude: number; longitude: number; accuracy?: number} | null>(null);
  const [consentIp, setConsentIp] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  
  // Get IP Address
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setConsentIp(data.ip))
      .catch(() => setConsentIp(null));
  }, []);
  
  // Get Location when consent is required AND location is required
  useEffect(() => {
    if (form.require_consent && form.consent_require_location && consentChecked && locationStatus === 'idle') {
      setLocationStatus('requesting');
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setConsentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
            setLocationStatus('granted');
          },
          () => {
            setLocationStatus('denied');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocationStatus('denied');
      }
    }
  }, [form.require_consent, form.consent_require_location, consentChecked, locationStatus]);

  const validateField = (field: FormField, value: unknown): string => {
    if (field.required && (!value || value === '')) {
      return 'จำเป็นต้องกรอกข้อมูลนี้';
    }

    if (!value) return '';

    switch (field.type) {
      case 'email':
        if (!isValidEmail(String(value))) {
          return 'รูปแบบอีเมลไม่ถูกต้อง';
        }
        break;
      case 'tel':
        // No pattern validation for phone
        break;
      case 'number':
        if (isNaN(Number(value))) {
          return 'ต้องเป็นตัวเลขเท่านั้น';
        }
        break;
    }

    return '';
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    form.fields.forEach(field => {
      const error = validateField(field, responses[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) {
      return;
    }
    
    // Check consent if required
    if (form.require_consent && !consentChecked) {
      setErrors(prev => ({ ...prev, _consent: 'กรุณายินยอมก่อนส่งคำตอบ' }));
      return;
    }

    // Build submission data with consent
    const submissionData: Record<string, unknown> = {
      ...responses,
      _consent: form.require_consent ? {
        given: true,
        at: new Date().toISOString(),
        ip: consentIp,
        location: consentLocation,
      } : null,
    };

    onSubmit(submissionData);
    setSubmitted(true);
  };

  const updateResponse = (fieldId: string, value: unknown) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    // Clear error when user types
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          ขอบคุณสำหรับคำตอบ!
        </h3>
        <p className="text-slate-600">
          คำตอบของคุณถูกบันทึกเรียบร้อยแล้ว
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {form.fields.map((field) => (
        <FormFieldInput
          key={field.id}
          field={field}
          value={responses[field.id]}
          error={errors[field.id]}
          onChange={(value) => updateResponse(field.id, value)}
        />
      ))}

      {/* Consent Section */}
      {form.require_consent && (
        <div className="border border-green-200 bg-green-50 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-1">{form.consent_heading || 'การยินยอม (Consent)'}</h4>
              <p className="text-sm text-slate-600">{form.consent_text || 'ข้าพเจ้ายินยอมให้เก็บข้อมูลส่วนบุคคล'}</p>
            </div>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-colors">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => {
                setConsentChecked(e.target.checked);
                if (errors._consent) {
                  setErrors(prev => ({ ...prev, _consent: '' }));
                }
              }}
              className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-slate-700">ข้าพเจ้ายินยอมตามข้อความข้างต้น</span>
          </label>
          
          {errors._consent && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors._consent}
            </p>
          )}
          
          {/* Location Status - แสดงเฉพาะเมื่อตั้งค่าให้ขอตำแหน่ง */}
          {consentChecked && form.consent_require_location && (
            <div className="text-xs text-slate-500 space-y-1">
              {locationStatus === 'requesting' && (
                <div className="flex items-center gap-2 text-amber-600">
                  <div className="animate-spin w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full" />
                  กำลังขออนุญาตเข้าถึงตำแหน่ง...
                </div>
              )}
              {locationStatus === 'granted' && consentLocation && (
                <div className="flex items-center gap-2 text-green-600">
                  <MapPin className="w-3 h-3" />
                  บันทึกตำแหน่ง: {consentLocation.latitude.toFixed(4)}, {consentLocation.longitude.toFixed(4)}
                  (คลาดเคลื่อน ~{Math.round(consentLocation.accuracy || 0)} เมตร)
                </div>
              )}
              {locationStatus === 'denied' && (
                <div className="text-slate-400">
                  ไม่สามารถเข้าถึงตำแหน่งได้ (ผู้ใช้ไม่อนุญาต หรือเบราว์เซอร์ไม่รองรับ)
                </div>
              )}
            </div>
          )}
          
          {/* IP Address - แสดงเสมอเมื่อ consent ถูกติ๊ก */}
          {consentChecked && consentIp && (
            <div className="text-xs text-slate-400">
              IP: {consentIp}
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || (form.require_consent && !consentChecked)}
        className={cn(
          "w-full py-3 px-6 rounded-lg font-medium text-white transition-all",
          submitting || (form.require_consent && !consentChecked)
            ? "bg-slate-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
        )}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            กำลังส่ง...
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}

// ==================== Individual Field Components ====================

interface FormFieldInputProps {
  field: FormField;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

function FormFieldInput({ field, value, error, onChange }: FormFieldInputProps) {
  // heading, section และ info_box มีการแสดง label ใน FieldControl แล้ว
  const isLayoutField = field.type === 'heading' || field.type === 'section' || field.type === 'info_box';

  return (
    <div className="space-y-2 select-none">
      {!isLayoutField && (
        <label className="block font-medium text-slate-900">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {field.helpText && !isLayoutField && (
        <p className="text-sm text-slate-500">{field.helpText}</p>
      )}

      <FieldControl field={field} value={value} onChange={onChange} />

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

function FieldControl({ field, value, onChange }: Omit<FormFieldInputProps, 'error'>) {
  const baseClassName = cn(
    "w-full px-4 py-3 border rounded-lg transition-all",
    "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    "placeholder:text-slate-400",
    "select-none"
  );

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
      return (
        <input
          type={field.type}
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClassName}
          style={{ userSelect: 'text' }}
        />
      );

    case 'textarea':
      return (
        <textarea
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={cn(baseClassName, "resize-none")}
          style={{ userSelect: 'text' }}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          placeholder={field.placeholder}
          className={baseClassName}
          style={{ userSelect: 'text' }}
        />
      );

    case 'choice':
      const isOther = typeof value === 'string' && value.startsWith('other:');
      const choiceOtherValue = isOther ? value.replace('other:', '') : '';
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <label
              key={idx}
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all select-none",
                value === option 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-slate-300 hover:border-slate-300"
              )}
            >
              <input
                type="radio"
                name={field.id}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="select-none">{option}</span>
            </label>
          ))}
          {field.allow_other && (
            <label
              className={cn(
                "flex flex-col gap-2 p-3 border rounded-lg cursor-pointer transition-all select-none",
                isOther ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name={field.id}
                  checked={isOther}
                  onChange={() => onChange('other:')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-slate-700">อื่นๆ (โปรดระบุ)</span>
              </div>
              {isOther && (
                <input
                  type="text"
                  value={choiceOtherValue}
                  onChange={(e) => onChange(`other:${e.target.value}`)}
                  placeholder="ระบุคำตอบของคุณ"
                  className="ml-7 px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </label>
          )}
        </div>
      );

    case 'multiple_choice':
      const selectedValues = (value as string[]) || [];
      const otherIndex = selectedValues.findIndex(v => v.startsWith('other:'));
      const hasOther = otherIndex >= 0;
      const multiOtherValue = hasOther ? selectedValues[otherIndex].replace('other:', '') : '';
      
      const toggleOther = (checked: boolean) => {
        if (checked) {
          onChange([...selectedValues, 'other:']);
        } else {
          onChange(selectedValues.filter(v => !v.startsWith('other:')));
        }
      };
      
      const updateOtherValue = (text: string) => {
        const newValues = selectedValues.filter(v => !v.startsWith('other:'));
        if (text) {
          newValues.push(`other:${text}`);
        } else {
          newValues.push('other:');
        }
        onChange(newValues);
      };
      
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <label
              key={idx}
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all select-none",
                selectedValues.includes(option)
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 hover:border-slate-300"
              )}
            >
              <input
                type="checkbox"
                value={option}
                checked={selectedValues.includes(option)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedValues, option]);
                  } else {
                    onChange(selectedValues.filter(v => v !== option));
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="select-none">{option}</span>
            </label>
          ))}
          {field.allow_other && (
            <label
              className={cn(
                "flex flex-col gap-2 p-3 border rounded-lg cursor-pointer transition-all select-none",
                hasOther ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={hasOther}
                  onChange={(e) => toggleOther(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-slate-700">อื่นๆ (โปรดระบุ)</span>
              </div>
              {hasOther && (
                <input
                  type="text"
                  value={multiOtherValue}
                  onChange={(e) => updateOtherValue(e.target.value)}
                  placeholder="ระบุคำตอบของคุณ"
                  className="ml-7 px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </label>
          )}
        </div>
      );

    case 'rating':
      return (
        <RatingInput
          value={Number(value) || 0}
          max={field.max || 5}
          onChange={onChange}
        />
      );

    case 'scale':
      return (
        <ScaleInput
          value={Number(value) || field.min || 1}
          min={field.min || 1}
          max={field.max || 10}
          onChange={onChange}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseClassName}
          style={{ userSelect: 'text' }}
        />
      );

    case 'time':
      return (
        <input
          type="time"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseClassName}
          style={{ userSelect: 'text' }}
        />
      );

    case 'dropdown':
      const dropdownOptions = field.options || [];
      const dropdownValue = String(value || '');
      const isDropdownOther = dropdownValue.startsWith('other:');
      const dropdownOtherValue = isDropdownOther ? dropdownValue.replace('other:', '') : '';
      
      return (
        <div className="space-y-2">
          <select
            value={isDropdownOther ? '_other_' : dropdownValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '_other_') {
                onChange('other:');
              } else {
                onChange(val);
              }
            }}
            className={cn(baseClassName, "bg-white")}
          >
            <option value="" disabled>-- เลือก --</option>
            {dropdownOptions.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
            {field.allow_other && (
              <option value="_other_">อื่นๆ (โปรดระบุ)</option>
            )}
          </select>
          
          {isDropdownOther && (
            <input
              type="text"
              value={dropdownOtherValue}
              onChange={(e) => onChange(`other:${e.target.value}`)}
              placeholder="ระบุคำตอบของคุณ"
              className={cn(baseClassName, "mt-2")}
              autoFocus
            />
          )}
        </div>
      );

    case 'heading':
      return (
        <div className="py-6">
          <h2 className="text-4xl font-bold text-slate-900">{field.label}</h2>
          {field.helpText && <p className="text-xl text-slate-600 mt-3">{field.helpText}</p>}
        </div>
      );
    
    case 'section':
      return (
        <div className="border-2 border-slate-300 rounded-xl bg-white p-6 my-4 shadow-sm">
          {field.label && <h4 className="text-lg font-semibold text-slate-900 mb-2">{field.label}</h4>}
          {field.helpText && <p className="text-slate-600 whitespace-pre-wrap">{field.helpText}</p>}
        </div>
      );

    case 'info_box':
      return (
        <div className="border-2 border-slate-300 rounded-xl bg-white p-6 my-4 shadow-sm">
          {field.label && (
            <h4 className="text-lg font-semibold text-slate-900 mb-3">{field.label}</h4>
          )}
          {field.helpText && (
            <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {field.helpText}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

// ==================== Rating Component ====================

function RatingInput({ 
  value, 
  max, 
  onChange 
}: { 
  value: number; 
  max: number; 
  onChange: (value: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1 select-none">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "w-8 h-8 transition-colors",
              (hoverValue ? star <= hoverValue : star <= value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ==================== Scale Component ====================

function ScaleInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 min-w-[2rem] text-center">{min}</span>
        <div className="flex-1 flex justify-between gap-2">
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={cn(
                "w-10 h-10 rounded-lg font-medium transition-all",
                value === num
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {num}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-500 min-w-[2rem] text-center">{max}</span>
      </div>
      <div className="flex justify-between text-sm text-slate-400 select-none">
        <span>ไม่เห็นด้วยอย่างยิ่ง</span>
        <span>เห็นด้วยอย่างยิ่ง</span>
      </div>
    </div>
  );
}
