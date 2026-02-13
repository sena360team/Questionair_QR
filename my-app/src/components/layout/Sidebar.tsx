'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  QrCode, 
  BarChart3,
  FolderKanban,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/forms', label: 'แบบสอบถาม', icon: FileText },
  { href: '/admin/submissions', label: 'ผลแบบสอบถาม', icon: ClipboardList },
  { href: '/admin/qr-codes', label: 'QR Codes', icon: QrCode },
  { href: '/admin/projects', label: 'โครงการ', icon: FolderKanban },
  { href: '/admin/analytics', label: 'รายงาน', icon: BarChart3 },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "h-full bg-white border-r-2 border-slate-300 flex flex-col transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "border-b border-slate-300 flex items-center",
        collapsed ? "p-4 justify-center" : "p-6"
      )}>
        <Link href="/admin" className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-slate-900">QR Survey</h1>
              <p className="text-xs text-slate-500">Survey System</p>
            </div>
          )}
        </Link>
      </div>

      {/* Toggle Button - Desktop only */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="hidden lg:flex mx-4 -mb-3 mt-3 z-10 w-6 h-6 bg-white border-2 border-slate-300 rounded-full items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors self-end"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-slate-500" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-slate-500" />
          )}
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                collapsed ? "justify-center" : "",
                isActive 
                  ? "bg-blue-50 text-blue-600 font-medium" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-blue-600" : "text-slate-400"
              )} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center">
            Questionnaire QR System
          </p>
        </div>
      )}
    </div>
  );
}
