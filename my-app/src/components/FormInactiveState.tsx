'use client';

import { CalendarX } from 'lucide-react';

export default function FormInactiveState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-100 overflow-hidden">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
        
        {/* Content */}
        <div className="p-8 md:p-10 text-center">
          {/* Icon Container */}
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <CalendarX className="w-12 h-12 text-amber-600" strokeWidth={1.5} />
          </div>
          
          {/* Title Only */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 whitespace-nowrap">
            ขออภัย แบบสอบถามนี้ถูกปิดใช้งานชั่วคราว
          </h1>
        </div>
      </div>
      
      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
