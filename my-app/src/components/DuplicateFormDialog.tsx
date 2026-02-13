'use client';

import { useState } from 'react';
import { Form } from '@/types';
import { useDuplicateForm } from '@/hooks/useDuplicateForm';
import { useRouter } from 'next/navigation';
import { 
  Copy, 
  X, 
  FileText, 
  Settings, 
  Image as ImageIcon, 
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DuplicateFormDialogProps {
  form: Form;
  isOpen: boolean;
  onClose: () => void;
}

interface CopyOption {
  key: 'copy_questions' | 'copy_settings' | 'copy_logo';
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultChecked: boolean;
  recommended?: boolean;
}

export function DuplicateFormDialog({ form, isOpen, onClose }: DuplicateFormDialogProps) {
  const router = useRouter();
  const { duplicate, isDuplicating } = useDuplicateForm();
  
  const [newTitle, setNewTitle] = useState(`${form.title} (Copy)`);
  const [options, setOptions] = useState({
    copy_questions: true,
    copy_settings: true,
    copy_logo: true,
  });
  const [error, setError] = useState<string | null>(null);

  const copyOptions: CopyOption[] = [
    {
      key: 'copy_questions',
      label: 'คำถามทั้งหมด',
      description: `${form.fields.length} คำถาม`,
      icon: <FileText className="w-5 h-5" />,
      defaultChecked: true,
      recommended: true,
    },
    {
      key: 'copy_settings',
      label: 'การตั้งค่า Consent',
      description: 'การยินยอมและข้อความต่างๆ',
      icon: <Settings className="w-5 h-5" />,
      defaultChecked: true,
    },
    {
      key: 'copy_logo',
      label: 'โลโก้',
      description: form.logo_url ? 'มีโลโก้' : 'ไม่มีโลโก้',
      icon: <ImageIcon className="w-5 h-5" />,
      defaultChecked: !!form.logo_url,
    },
  ];

  const handleOptionChange = (key: keyof typeof options, checked: boolean) => {
    setOptions(prev => ({ ...prev, [key]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newTitle.trim()) {
      setError('กรุณาระบุชื่อฟอร์ม');
      return;
    }
    
    try {
      const result = await duplicate(form.id, newTitle.trim(), options);
      console.log('Duplicate result:', result);
      console.log('new_form_id:', result.new_form_id);
      console.log('Type of new_form_id:', typeof result.new_form_id);
      onClose();
      router.push(`/admin/forms/${result.new_form_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Copy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">คัดลอกฟอร์ม</h3>
              <p className="text-sm text-slate-500">สร้างฟอร์มใหม่จาก "{form.title}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              ชื่อฟอร์มใหม่ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="เช่น: แบบสอบถามความพึงพอใจ Q2/2024"
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1.5">
              รหัสฟอร์มจะสร้างอัตโนมัติ (เช่น FRM-024)
            </p>
          </div>
          
          {/* Copy Options */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              คัดลอกอะไรบ้าง?
            </label>
            <div className="space-y-3">
              {copyOptions.map((option) => (
                <label
                  key={option.key}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    options[option.key]
                      ? "border-blue-200 bg-blue-50/50"
                      : "border-slate-300 hover:border-slate-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={options[option.key]}
                    onChange={(e) => handleOptionChange(option.key, e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-slate-600",
                        options[option.key] && "text-blue-600"
                      )}>
                        {option.icon}
                      </span>
                      <span className="font-medium text-slate-900">
                        {option.label}
                      </span>
                      {option.recommended && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          แนะนำ
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          {/* Info Box */}
          <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600">
            <p className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                ฟอร์มใหม่จะถูกสร้างเป็น <strong>Draft</strong> คุณสามารถแก้ไขได้ก่อน Publish
              </span>
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isDuplicating || !newTitle.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังคัดลอก...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  สร้างฟอร์มใหม่
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
