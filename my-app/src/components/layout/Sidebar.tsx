'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  QrCode, 
  BarChart3,
  Plus,
  FolderKanban,
  ClipboardList
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/forms', label: 'แบบสอบถาม', icon: FileText },
  { href: '/admin/submissions', label: 'ผลแบบสอบถาม', icon: ClipboardList },
  { href: '/admin/qr-codes', label: 'QR Codes', icon: QrCode },
  { href: '/admin/projects', label: 'โครงการ', icon: FolderKanban },
  { href: '/admin/analytics', label: 'รายงาน', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">QR Survey</h1>
            <p className="text-xs text-slate-500">Survey System</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
