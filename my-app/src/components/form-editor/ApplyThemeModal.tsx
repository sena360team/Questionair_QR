'use client';

import { useEffect } from 'react';
import { X, Palette, Check, CheckCircle } from 'lucide-react';

interface ApplyThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isSuccess?: boolean;
  themeData: {
    theme: string;
    bannerColor: string;
    bannerCustomColor: string;
    bannerMode: string;
    accentColor: string;
    accentCustomColor: string;
  };
}

const themeLabels: Record<string, string> = {
  default: 'มาตรฐาน',
  'card-groups': 'การ์ดแยกกลุ่ม',
  'step-wizard': 'ขั้นตอน Step',
  minimal: 'มินิมอล',
};

const bannerColorLabels: Record<string, string> = {
  blue: 'น้ำเงิน',
  black: 'ดำ',
  white: 'ขาว',
  custom: 'กำหนดเอง',
};

const accentColorLabels: Record<string, string> = {
  blue: 'น้ำเงิน',
  sky: 'ฟ้า',
  teal: 'เขียวมรกต',
  emerald: 'เขียวอมะ',
  violet: 'ม่วง',
  rose: 'ชมพู',
  orange: 'ส้ม',
  slate: 'เทา',
  black: 'ดำ',
  custom: 'กำหนดเอง',
};

export function ApplyThemeModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  isSuccess = false,
  themeData,
}: ApplyThemeModalProps) {
  // Auto close after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  if (!isOpen) return null;

  const getBannerColorDisplay = () => {
    if (themeData.bannerColor === 'custom') {
      return (
        <div className="flex items-center gap-2">
          <span>กำหนดเอง</span>
          <div
            className="w-6 h-6 rounded border border-slate-300"
            style={{ backgroundColor: themeData.bannerCustomColor }}
          />
          <span className="text-slate-500 text-sm">({themeData.bannerCustomColor})</span>
        </div>
      );
    }
    const colors: Record<string, string> = {
      blue: '#2563EB',
      black: '#0F172A',
      white: '#FFFFFF',
    };
    return (
      <div className="flex items-center gap-2">
        <span>{bannerColorLabels[themeData.bannerColor] || themeData.bannerColor}</span>
        <div
          className="w-6 h-6 rounded border border-slate-300"
          style={{ backgroundColor: colors[themeData.bannerColor] || themeData.bannerColor }}
        />
      </div>
    );
  };

  const getAccentColorDisplay = () => {
    if (themeData.accentColor === 'custom') {
      return (
        <div className="flex items-center gap-2">
          <span>กำหนดเอง</span>
          <div
            className="w-6 h-6 rounded border border-slate-300"
            style={{ backgroundColor: themeData.accentCustomColor }}
          />
          <span className="text-slate-500 text-sm">({themeData.accentCustomColor})</span>
        </div>
      );
    }
    const colors: Record<string, string> = {
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
    return (
      <div className="flex items-center gap-2">
        <span>{accentColorLabels[themeData.accentColor] || themeData.accentColor}</span>
        <div
          className="w-6 h-6 rounded border border-slate-300"
          style={{ backgroundColor: colors[themeData.accentColor] || themeData.accentColor }}
        />
      </div>
    );
  };

  // Success State
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Apply Theme สำเร็จ!
          </h3>
          <p className="text-slate-500">
            ธีมและสีของฟอร์มได้รับการอัพเดตแล้ว
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">ยืนยันการ Apply Theme</h3>
              <p className="text-sm text-slate-500">ตรวจสอบการตั้งค่าก่อนบันทึก</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
            <span className="text-slate-600">ธีมฟอร์ม</span>
            <span className="font-medium text-slate-900">
              {themeLabels[themeData.theme] || themeData.theme}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
            <span className="text-slate-600">สี Banner</span>
            <div className="font-medium text-slate-900">
              {getBannerColorDisplay()}
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
            <span className="text-slate-600">รูปแบบ Banner</span>
            <span className="font-medium text-slate-900 capitalize">
              {themeData.bannerMode === 'gradient' ? 'Gradient (ไล่สี)' : 'Solid (สีทึบ)'}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
            <span className="text-slate-600">สีรอง (Accent)</span>
            <div className="font-medium text-slate-900">
              {getAccentColorDisplay()}
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
          <p className="text-sm text-amber-800">
            <span className="font-medium">หมายเหตุ:</span> การ Apply Theme จะอัพเดตทันทีโดยไม่สร้าง Version ใหม่ 
            และไม่กระทบคำถามที่มีอยู่
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                ยืนยัน Apply Theme
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
