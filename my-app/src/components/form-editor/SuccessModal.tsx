'use client';

import { X, CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export function SuccessModal({
  isOpen,
  title,
  message,
  buttonText = 'ตกลง',
  onClose
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {title}
          </h3>
          <p className="text-slate-600 mb-6">
            {message}
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
