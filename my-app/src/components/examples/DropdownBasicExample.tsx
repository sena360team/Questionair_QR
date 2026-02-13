/**
 * 🔽 Dropdown Basic Example
 * 
 * ตัวอย่างการใช้ Dropdown Basic ใน FormBuilder และ FormRenderer
 * สามารถ copy ไปใช้ได้เลย
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// ============================================
// TYPES
// ============================================
type FieldType = 'text' | 'textarea' | 'dropdown' | 'choice' | 'multiple_choice';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  allow_other?: boolean;
  helpText?: string;
}

// ============================================
// 1. FORM BUILDER - สร้าง Dropdown
// ============================================

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: type === 'dropdown' ? 'คำถามแบบ Dropdown' : 'คำถามใหม่',
      placeholder: type === 'dropdown' ? 'เลือก...' : '',
      required: false,
      options: type === 'dropdown' ? ['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3'] : undefined,
    };
    onChange([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) return;

    const newFields = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    onChange(newFields);
  };

  const addOption = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const newOptions = [...(field.options || []), `ตัวเลือก ${(field.options?.length || 0) + 1}`];
    updateField(fieldId, { options: newOptions });
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field?.options) return;
    
    const newOptions = [...field.options];
    newOptions[optionIndex] = value;
    updateField(fieldId, { options: newOptions });
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field?.options) return;
    
    const newOptions = field.options.filter((_, i) => i !== optionIndex);
    updateField(fieldId, { options: newOptions });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg">
        <button
          onClick={() => addField('text')}
          className="px-3 py-2 bg-white border-2 border-slate-300 rounded-lg text-sm hover:bg-slate-50"
        >
          + ข้อความ
        </button>
        <button
          onClick={() => addField('textarea')}
          className="px-3 py-2 bg-white border-2 border-slate-300 rounded-lg text-sm hover:bg-slate-50"
        >
          + ข้อความยาว
        </button>
        <button
          onClick={() => addField('dropdown')}
          className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-100 font-medium"
        >
          + 🔽 Dropdown
        </button>
        <button
          onClick={() => addField('choice')}
          className="px-3 py-2 bg-white border-2 border-slate-300 rounded-lg text-sm hover:bg-slate-50"
        >
          + ตัวเลือกเดียว
        </button>
        <button
          onClick={() => addField('multiple_choice')}
          className="px-3 py-2 bg-white border-2 border-slate-300 rounded-lg text-sm hover:bg-slate-50"
        >
          + หลายตัวเลือก
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-white border-2 border-slate-300 rounded-xl p-4 hover:border-blue-300 transition-colors"
          >
            {/* Field Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">
                  {index + 1}.
                </span>
                <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                  {field.type === 'dropdown' ? '🔽 Dropdown' : field.type}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveField(field.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveField(field.id, 'down')}
                  disabled={index === fields.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeField(field.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Field Content */}
            <div className="space-y-3">
              {/* Label */}
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                placeholder="คำถาม"
              />

              {/* Placeholder (for text/textarea/dropdown) */}
              {(field.type === 'text' || field.type === 'textarea' || field.type === 'dropdown') && (
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Placeholder (optional)"
                />
              )}

              {/* 🔽 Dropdown Options Editor */}
              {field.type === 'dropdown' && (
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-slate-700">ตัวเลือก Dropdown:</p>
                  <div className="space-y-2">
                    {field.options?.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">{optIndex + 1}.</span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(field.id, optIndex, e.target.value)}
                          className="flex-1 px-3 py-1.5 border-2 border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                          onClick={() => removeOption(field.id, optIndex)}
                          className="p-1 text-red-400 hover:text-red-600"
                          disabled={field.options?.length === 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addOption(field.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + เพิ่มตัวเลือก
                  </button>
                  
                  {/* Preview of Dropdown */}
                  <div className="mt-3 pt-3 border-t border-slate-300">
                    <p className="text-xs text-slate-500 mb-2">ตัวอย่างแสดงผล:</p>
                    <div className="relative">
                      <select
                        disabled
                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg bg-white appearance-none text-slate-400 text-sm"
                      >
                        <option>{field.placeholder || 'เลือก...'}</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Choice Options */}
              {(field.type === 'choice' || field.type === 'multiple_choice') && (
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-slate-700">ตัวเลือก:</p>
                  {field.options?.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <input
                        type={field.type === 'choice' ? 'radio' : 'checkbox'}
                        disabled
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(field.id, optIndex, e.target.value)}
                        className="flex-1 px-3 py-1.5 border-2 border-slate-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => removeOption(field.id, optIndex)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(field.id)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + เพิ่มตัวเลือก
                  </button>
                </div>
              )}

              {/* Required Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">บังคับตอบ</span>
              </label>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-300 rounded-xl">
            <p>ยังไม่มีคำถาม</p>
            <p className="text-sm">กดปุ่มด้านบนเพื่อเพิ่มคำถาม</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 2. FORM RENDERER - แสดงผล Dropdown
// ============================================

interface FormRendererProps {
  fields: FormField[];
  onSubmit?: (responses: Record<string, any>) => void;
  theme?: 'minimal' | 'bordered' | 'filled';
}

export function FormRenderer({ fields, onSubmit, theme = 'minimal' }: FormRendererProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const themeClasses = {
    minimal: {
      input: "border-slate-300 focus:ring-blue-500 focus:border-blue-500",
      select: "border-slate-300 focus:ring-blue-500 focus:border-blue-500",
      label: "text-slate-900",
    },
    bordered: {
      input: "border-2 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500",
      select: "border-2 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500",
      label: "text-slate-800",
    },
    filled: {
      input: "border-none bg-slate-50 focus:ring-2 focus:ring-violet-500",
      select: "border-none bg-slate-50 focus:ring-2 focus:ring-violet-500",
      label: "text-slate-800",
    },
  };

  const t = themeClasses[theme];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && !responses[field.id]) {
        newErrors[field.id] = 'กรุณากรอกข้อมูล';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit?.(responses);
  };

  const updateResponse = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2">
          {/* Label */}
          <label className={`block font-medium ${t.label}`}>
            <span className="text-sm text-blue-600 mr-2">{index + 1}.</span>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.helpText && (
            <p className="text-sm text-slate-500">{field.helpText}</p>
          )}

          {/* Text Input */}
          {field.type === 'text' && (
            <input
              type="text"
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${t.input}`}
              placeholder={field.placeholder}
              value={responses[field.id] || ''}
              onChange={(e) => updateResponse(field.id, e.target.value)}
            />
          )}

          {/* Textarea */}
          {field.type === 'textarea' && (
            <textarea
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all resize-none min-h-[120px] ${t.input}`}
              placeholder={field.placeholder}
              value={responses[field.id] || ''}
              onChange={(e) => updateResponse(field.id, e.target.value)}
              rows={4}
            />
          )}

          {/* 🔽 Dropdown Basic */}
          {field.type === 'dropdown' && (
            <div className="relative">
              <select
                className={`w-full px-4 py-3 border rounded-xl outline-none transition-all appearance-none bg-white cursor-pointer ${t.select} ${
                  errors[field.id] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                value={responses[field.id] || ''}
                onChange={(e) => updateResponse(field.id, e.target.value)}
              >
                <option value="" disabled className="text-slate-400">
                  {field.placeholder || 'เลือก...'}
                </option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Choice (Radio) */}
          {field.type === 'choice' && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    className="w-5 h-5 text-blue-600 border-slate-300 focus:ring-blue-500"
                    checked={responses[field.id] === option}
                    onChange={(e) => updateResponse(field.id, e.target.value)}
                  />
                  <span className="text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Multiple Choice (Checkbox) */}
          {field.type === 'multiple_choice' && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    value={option}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    checked={(responses[field.id] || []).includes(option)}
                    onChange={(e) => {
                      const current = responses[field.id] || [];
                      const updated = e.target.checked
                        ? [...current, option]
                        : current.filter((v: string) => v !== option);
                      updateResponse(field.id, updated);
                    }}
                  />
                  <span className="text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Error Message */}
          {errors[field.id] && (
            <p className="text-sm text-red-500">{errors[field.id]}</p>
          )}
        </div>
      ))}

      {fields.length > 0 && onSubmit && (
        <button
          type="submit"
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          ส่งคำตอบ
        </button>
      )}
    </form>
  );
}

// ============================================
// 3. DEMO PAGE - ตัวอย่างการใช้งาน
// ============================================

export default function DropdownExamplePage() {
  const [fields, setFields] = useState<FormField[]>([
    {
      id: 'name',
      type: 'text',
      label: 'ชื่อ-นามสกุล',
      placeholder: 'กรุณากรอกชื่อ',
      required: true,
    },
    {
      id: 'province',
      type: 'dropdown',
      label: 'จังหวัด',
      placeholder: 'เลือกจังหวัด',
      required: true,
      options: ['กรุงเทพมหานคร', 'เชียงใหม่', 'ภูเก็ต', 'ชลบุรี'],
    },
    {
      id: 'satisfaction',
      type: 'choice',
      label: 'ความพึงพอใจ',
      required: true,
      options: ['มากที่สุด', 'มาก', 'ปานกลาง', 'น้อย'],
    },
  ]);

  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [theme, setTheme] = useState<'minimal' | 'bordered' | 'filled'>('minimal');
  const [lastSubmission, setLastSubmission] = useState<Record<string, any> | null>(null);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          🔽 Dropdown Basic Example
        </h1>
        <p className="text-slate-600 mb-6">
          ตัวอย่างการใช้ Dropdown แบบพื้นฐานใน Form Builder และ Form Renderer
        </p>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'builder'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            🛠️ Form Builder
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            👁️ Preview
          </button>
        </div>

        {/* Theme Selector (only in preview) */}
        {activeTab === 'preview' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-slate-600">Theme:</span>
            {(['minimal', 'bordered', 'filled'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                  theme === t
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Builder */}
          <div className={`${activeTab === 'builder' ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                🛠️ Form Builder
              </h2>
              <FormBuilder fields={fields} onChange={setFields} />
            </div>
          </div>

          {/* Right: Preview */}
          <div className={`${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                👁️ Preview (Theme: {theme})
              </h2>
              <FormRenderer
                fields={fields}
                theme={theme}
                onSubmit={(responses) => {
                  setLastSubmission(responses);
                  alert('Form submitted! Check console for data.');
                  console.log('Form responses:', responses);
                }}
              />
            </div>

            {/* Submission Result */}
            {lastSubmission && (
              <div className="mt-4 bg-slate-900 rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Last Submission:
                </h3>
                <pre className="text-sm text-green-400 overflow-auto">
                  {JSON.stringify(lastSubmission, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            📋 วิธีใช้งาน
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>กด "+ 🔽 Dropdown" เพื่อเพิ่มคำถามแบบ Dropdown</li>
            <li>คลิกที่คำถามเพื่อแก้ไข label และ placeholder</li>
            <li>เพิ่ม/ลบ/แก้ไขตัวเลือกใน Dropdown ได้</li>
            <li>สลับไป Tab "Preview" เพื่อดูตัวอย่างการแสดงผล</li>
            <li>ลองเปลี่ยน Theme ดูความแตกต่าง (Minimal, Bordered, Filled)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
