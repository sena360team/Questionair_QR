'use client';

import { FileEdit, Settings, QrCode, History } from 'lucide-react';

export type TabType = 'content' | 'settings' | 'qr-codes' | 'history';

interface FormTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'content' as TabType, label: 'เนื้อหา', icon: FileEdit },
  { id: 'settings' as TabType, label: 'ตั้งค่า', icon: Settings },
  { id: 'qr-codes' as TabType, label: 'QR Code', icon: QrCode },
  { id: 'history' as TabType, label: 'ประวัติ', icon: History },
];

export function FormTabs({ activeTab, onTabChange }: FormTabsProps) {
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-3 py-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors
              ${activeTab === tab.id 
                ? 'text-green-600 border-b-2 border-green-600' 
                : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
