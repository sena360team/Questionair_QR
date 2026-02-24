'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/forms': 'แบบสอบถาม',
  '/admin/forms/create': 'สร้างแบบสอบถาม',
  '/admin/submissions': 'ผลแบบสอบถาม',
  '/admin/qr-codes': 'QR Codes',
  '/admin/projects': 'โครงการ',
  '/admin/analytics': 'รายงาน',
  '/admin/settings': 'ตั้งค่า',
};

export function Breadcrumb() {
  const pathname = usePathname();

  // Build breadcrumb items
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  let currentPath = '';
  paths.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Get label from routeMap or use segment
    let label = routeMap[currentPath];

    // For dynamic routes like /admin/forms/[id]
    if (!label && index > 0) {
      // Check if it's a UUID (form ID, submission ID, etc.)
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Try to get context from previous segment
        const prevPath = currentPath.split('/').slice(0, -1).join('/');
        if (prevPath.includes('/forms')) {
          label = 'แก้ไขแบบสอบถาม';
        } else if (prevPath.includes('/submissions')) {
          label = 'รายละเอียดคำตอบ';
        } else if (prevPath.includes('/qr-codes')) {
          label = 'รายละเอียด QR';
        } else if (prevPath.includes('/projects')) {
          label = 'รายละเอียดโครงการ';
        } else {
          label = 'รายละเอียด';
        }
      } else {
        label = segment;
      }
    }

    if (label) {
      breadcrumbs.push({
        label,
        href: currentPath,
      });
    }
  });

  // Don't show breadcrumb on dashboard root
  if (pathname === '/admin') {
    return null;
  }

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex items-center gap-2 text-sm">
          {/* Home */}
          <Link
            href="/admin"
            className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          {/* Breadcrumb items */}
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={crumb.href} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-slate-400" />
                {isLast ? (
                  <span className="text-slate-900 font-medium truncate max-w-[200px] sm:max-w-none">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-slate-500 hover:text-blue-600 transition-colors truncate max-w-[150px] sm:max-w-none"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
