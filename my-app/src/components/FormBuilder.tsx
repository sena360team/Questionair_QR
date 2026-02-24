'use client';

import { useState, useRef } from 'react';
import { FormField, FieldType } from '@/types';
import { cn, generateId } from '@/lib/utils';
import { getVersionColor } from '@/lib/versionColors';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Type, 
  AlignLeft, 
  List, 
  CheckSquare,
  Star,
  Calendar,
  Clock,
  Sliders,
  Hash,
  Mail,
  Phone,
  Heading,
  LayoutTemplate,
  MoveVertical,
  Info,
  Sparkles
} from 'lucide-react';

const FIELD_TYPES = [
  { type: 'section' as FieldType, label: 'Section', icon: <LayoutTemplate className="w-4 h-4" />, category: 'layout' as const },
  { type: 'heading' as FieldType, label: 'หัวข้อ', icon: <Heading className="w-4 h-4" />, category: 'layout' as const },
  { type: 'info_box' as FieldType, label: 'กล่องข้อความ', icon: <Info className="w-4 h-4" />, category: 'layout' as const },
  { type: 'text' as FieldType, label: 'ข้อความสั้น', icon: <Type className="w-4 h-4" />, category: 'input' as const },
  { type: 'textarea' as FieldType, label: 'ข้อความยาว', icon: <AlignLeft className="w-4 h-4" />, category: 'input' as const },
  { type: 'email' as FieldType, label: 'อีเมล', icon: <Mail className="w-4 h-4" />, category: 'input' as const },
  { type: 'tel' as FieldType, label: 'เบอร์โทร', icon: <Phone className="w-4 h-4" />, category: 'input' as const },
  { type: 'number' as FieldType, label: 'ตัวเลข', icon: <Hash className="w-4 h-4" />, category: 'input' as const },
  { type: 'choice' as FieldType, label: 'ตัวเลือกเดียว', icon: <List className="w-4 h-4" />, category: 'input' as const },
  { type: 'multiple_choice' as FieldType, label: 'หลายตัวเลือก', icon: <CheckSquare className="w-4 h-4" />, category: 'input' as const },
  { type: 'dropdown' as FieldType, label: 'Dropdown', icon: <List className="w-4 h-4" />, category: 'input' as const },
  { type: 'rating' as FieldType, label: 'ให้คะแนน', icon: <Star className="w-4 h-4" />, category: 'input' as const },
  { type: 'scale' as FieldType, label: 'สเกล', icon: <Sliders className="w-4 h-4" />, category: 'input' as const },
  { type: 'date' as FieldType, label: 'วันที่', icon: <Calendar className="w-4 h-4" />, category: 'input' as const },
  { type: 'time' as FieldType, label: 'เวลา', icon: <Clock className="w-4 h-4" />, category: 'input' as const },
];

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  currentVersion?: number;  // สำหรับกำหนดสีคำถามใหม่
}

export function FormBuilder({ fields, onChange, currentVersion = 0 }: FormBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addField = (type: FieldType) => {
    const getDefaultLabel = () => {
      switch(type) {
        case 'heading': return 'หัวข้อใหม่';
        case 'section': return 'ชื่อ Section';
        case 'info_box': return 'ข้อความแจ้งเตือน';
        case 'email': return 'อีเมล';
        case 'tel': return 'เบอร์โทรศัพท์';
        case 'text': return 'คำถามใหม่';
        case 'choice': return 'ตัวเลือก';
        case 'rating': return 'ให้คะแนน';
        default: return 'คำถาม';
      }
    };

    const getDefaultPlaceholder = () => {
      switch(type) {
        case 'email': return 'email@example.com';
        case 'tel': return '0xx-xxx-xxxx';
        default: return '';
      }
    };

    // ถ้าเป็นการเพิ่มคำถามใหม่ใน form ที่ published แล้ว (v1+)
    // ให้ mark ว่าเพิ่มใน version ถัดไป (currentVersion + 1)
    // v1 = baseline ไม่ต้อง mark, เริ่ม mark ตั้งแต่ v2+
    const nextVersion = currentVersion > 1 ? currentVersion + 1 : undefined;
    
    const newField: FormField = {
      id: generateId(),
      type,
      label: getDefaultLabel(),
      placeholder: getDefaultPlaceholder(),
      required: false,
      ...(type === 'choice' || type === 'multiple_choice' || type === 'dropdown'
        ? { options: ['ตัวเลือก 1', 'ตัวเลือก 2'] } 
        : {}),
      ...(type === 'rating' ? { min: 1, max: 5 } : {}),
      ...(type === 'scale' ? { min: 1, max: 10 } : {}),
      ...(nextVersion ? { _versionAdded: nextVersion } : {}),
    };
    onChange([...fields, newField]);
    setEditingId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
    if (editingId === id) setEditingId(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    const newFields = [...fields];
    const [removed] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, removed);
    
    onChange(newFields);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Layout Elements */}
      <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
        <span className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-3 block">
          องค์ประกอบหน้า
        </span>
        <div className="flex flex-wrap gap-2">
          {FIELD_TYPES.filter(f => f.category === 'layout').map(({ type, label, icon }) => (
            <button key={type} onClick={() => addField(type)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-purple-200 rounded-lg hover:border-purple-500 hover:text-purple-700 transition-colors shadow-sm">
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Fields */}
      <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-300">
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-3 block">
          คำถาม
        </span>
        <div className="flex flex-wrap gap-2">
          {FIELD_TYPES.filter(f => f.category === 'input').map(({ type, label, icon }) => (
            <button key={type} onClick={() => addField(type)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border-2 border-slate-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors">
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Fields List with Drag & Drop */}
      <div className="space-y-2">
        {fields.length === 0 && (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีคำถาม</p>
            <p className="text-sm">เลือกประเภทคำถามจากด้านบน</p>
          </div>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              "border rounded-xl transition-all",
              field.type === 'heading' ? "bg-purple-50 border-purple-200" :
              field.type === 'section' ? "bg-blue-50 border-blue-200" :
              field.type === 'info_box' ? "bg-amber-50 border-amber-200" :
              "bg-white border-slate-300",
              editingId === field.id ? "ring-2 ring-blue-500 border-blue-500" : "",
              draggedIndex === index ? "opacity-90 shadow-2xl scale-[1.02] border-blue-400 z-50" : "",
              dragOverIndex === index && draggedIndex !== index ? "border-blue-500 border-dashed border-2" : ""
            )}
          >
            {/* Drop indicator line */}
            {dragOverIndex === index && draggedIndex !== index && (
              <div className="h-1 bg-blue-500 rounded-full mx-4 -mt-0.5" />
            )}
            
            {/* Field Header */}
            <div className="flex items-center gap-3 p-3 border-b border-slate-300">
              <div 
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                title="ลากเพื่อย้าย"
              >
                <GripVertical className="w-5 h-5" />
              </div>
              
              <span className="text-xs font-medium text-slate-500 uppercase">
                {FIELD_TYPES.find(t => t.type === field.type)?.label}
              </span>
              
              <div className="flex-1" />
              
              <button
                onClick={() => {
                  const newFields = [...fields];
                  if (index > 0) {
                    [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
                    onChange(newFields);
                  }
                }}
                disabled={index === 0}
                className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                title="ขึ้น"
              >
                ↑
              </button>
              <button
                onClick={() => {
                  const newFields = [...fields];
                  if (index < fields.length - 1) {
                    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
                    onChange(newFields);
                  }
                }}
                disabled={index === fields.length - 1}
                className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                title="ลง"
              >
                ↓
              </button>
              <button
                onClick={() => setEditingId(editingId === field.id ? null : field.id)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {editingId === field.id ? 'เสร็จ' : 'แก้ไข'}
              </button>
              <button
                onClick={() => deleteField(field.id)}
                className="p-1 text-red-400 hover:text-red-600"
                title="ลบ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Field Content */}
            <div className="p-4">
              {editingId === field.id ? (
                <FieldEditor 
                  field={field} 
                  onChange={(updates) => updateField(field.id, updates)} 
                />
              ) : (
                <FieldPreview field={field} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Field Editor ====================

function FieldEditor({ field, onChange }: { field: FormField; onChange: (updates: Partial<FormField>) => void }) {
  const addOption = () => {
    const newOptions = [...(field.options || []), `ตัวเลือก ${(field.options?.length || 0) + 1}`];
    onChange({ options: newOptions });
  };

  const updateOption = (idx: number, value: string) => {
    const newOptions = field.options?.map((opt, i) => i === idx ? value : opt) || [];
    onChange({ options: newOptions });
  };

  const deleteOption = (idx: number) => {
    const newOptions = field.options?.filter((_, i) => i !== idx) || [];
    onChange({ options: newOptions });
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {field.type === 'heading' ? 'หัวข้อ' : 
           field.type === 'section' ? 'ชื่อ Section' :
           field.type === 'info_box' ? 'ข้อความ' : 'คำถาม'}
        </label>
        <input
          type="text"
          value={field.label || ''}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full px-3 py-2 border-2 border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Placeholder - only for input types */}
      {(field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'tel') && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            ตัวอย่างข้อความ (Placeholder)
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder={field.type === 'email' ? 'email@example.com' : field.type === 'tel' ? '0xx-xxx-xxxx' : ''}
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Options for choice types */}
      {(field.type === 'choice' || field.type === 'multiple_choice' || field.type === 'dropdown') && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">ตัวเลือก</label>
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={option || ''}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-md"
                />
                <button
                  onClick={() => deleteOption(idx)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addOption}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              เพิ่มตัวเลือก
            </button>
          </div>
          
          {/* Allow Other option */}
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={field.allow_other || false}
              onChange={(e) => onChange({ allow_other: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">เพิ่มตัวเลือก "อื่นๆ (โปรดระบุ)"</span>
          </label>
        </div>
      )}

      {/* Min/Max for rating/scale */}
      {(field.type === 'rating' || field.type === 'scale') && (
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ค่าต่ำสุด</label>
            <input
              type="number"
              value={field.min || 1}
              onChange={(e) => onChange({ min: parseInt(e.target.value) })}
              className="w-24 px-3 py-2 border-2 border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ค่าสูงสุด</label>
            <input
              type="number"
              value={field.max || 5}
              onChange={(e) => onChange({ max: parseInt(e.target.value) })}
              className="w-24 px-3 py-2 border-2 border-slate-300 rounded-md"
            />
          </div>
        </div>
      )}

      {/* Help Text */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {field.type === 'info_box' ? 'ข้อความในกล่อง (รองรับหลายบรรทัด)' : 'คำอธิบายเพิ่มเติม'}
        </label>
        {field.type === 'info_box' ? (
          <textarea
            value={field.helpText || ''}
            onChange={(e) => onChange({ helpText: e.target.value })}
            placeholder="พิมพ์ข้อความที่ต้องการแสดง..."
            rows={6}
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
          />
        ) : (
          <input
            type="text"
            value={field.helpText || ''}
            onChange={(e) => onChange({ helpText: e.target.value })}
            placeholder="ข้อความช่วยเหลือสำหรับผู้ตอบ"
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Required - only for input types */}
      {field.type !== 'heading' && field.type !== 'section' && field.type !== 'info_box' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.required || false}
            onChange={(e) => onChange({ required: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700">บังคับตอบ</span>
        </label>
      )}
    </div>
  );
}

// ==================== Field Preview (Compact) ====================

function FieldPreview({ field }: { field: FormField }) {
  // ดึงสีจาก version ที่เพิ่มคำถามนี้ (ถ้ามี)
  const versionColor = field._versionAdded ? getVersionColor(field._versionAdded) : undefined;
  const versionLabel = field._versionAdded ? `เพิ่มใน v${field._versionAdded}` : undefined;
  
  // Compact preview - just show summary
  if (field.type === 'heading') {
    return (
      <div className="py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-600 font-medium uppercase tracking-wide">หัวข้อ</span>
          {field._versionAdded && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: versionColor }}>
              <Sparkles className="w-3 h-3" />
              {versionLabel}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold leading-tight" style={{ color: versionColor || '#0f172a' }}>
          {field.label}
        </h3>
      </div>
    );
  }

  if (field.type === 'section') {
    return (
      <div className="py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Section</span>
          {field._versionAdded && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: versionColor }}>
              <Sparkles className="w-3 h-3" />
              {versionLabel}
            </span>
          )}
        </div>
        <h4 className="text-base font-semibold leading-tight" style={{ color: versionColor || '#1e293b' }}>
          {field.label}
        </h4>
      </div>
    );
  }

  if (field.type === 'info_box') {
    return (
      <div className="py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">กล่องข้อความ</span>
          {field._versionAdded && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: versionColor }}>
              <Sparkles className="w-3 h-3" />
              {versionLabel}
            </span>
          )}
        </div>
        <p className="text-sm font-medium line-clamp-1" style={{ color: versionColor || '#0f172a' }}>
          {field.label || 'ไม่มีหัวข้อ'}
        </p>
        {field.helpText && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{field.helpText}</p>
        )}
      </div>
    );
  }

  // Compact input preview
  const getTypeLabel = () => {
    switch(field.type) {
      case 'choice': return `ตัวเลือกเดียว (${field.options?.length || 0})`;
      case 'multiple_choice': return `หลายตัวเลือก (${field.options?.length || 0})`;
      case 'dropdown': return `Dropdown (${field.options?.length || 0})`;
      case 'rating': return `ให้คะแนน ${field.min}-${field.max}`;
      case 'scale': return `สเกล ${field.min}-${field.max}`;
      case 'text': return 'ข้อความสั้น';
      case 'textarea': return 'ข้อความยาว';
      case 'email': return 'อีเมล';
      case 'tel': return 'เบอร์โทร';
      case 'number': return 'ตัวเลข';
      case 'date': return 'วันที่';
      case 'time': return 'เวลา';
      default: return 'คำถาม';
    }
  };

  // แสดง options สำหรับ choice/multiple_choice/dropdown พร้อมสี version
  const showOptions = field.type === 'choice' || field.type === 'multiple_choice' || field.type === 'dropdown';
  
  return (
    <div className="py-1">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-medium truncate leading-tight" style={{ color: versionColor || '#0f172a' }}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </p>
        {field._versionAdded && (
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: versionColor }}>
            <Sparkles className="w-3 h-3" />
            v{field._versionAdded}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-2">{getTypeLabel()}</p>
      
      {/* แสดง options ถ้ามี */}
      {showOptions && field.options && field.options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((option, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border"
              style={{
                backgroundColor: versionColor ? `${versionColor}15` : 'rgba(107, 114, 128, 0.1)',
                borderColor: versionColor ? `${versionColor}40` : 'rgba(107, 114, 128, 0.2)',
                color: versionColor || '#374151'
              }}
            >
              {field.type === 'multiple_choice' && (
                <span className="mr-1">☑</span>
              )}
              {field.type === 'choice' && (
                <span className="mr-1">◯</span>
              )}
              {field.type === 'dropdown' && (
                <span className="mr-1">▼</span>
              )}
              {option}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
