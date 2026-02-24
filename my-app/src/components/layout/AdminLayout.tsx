'use client';

import { TopNavbar } from './TopNavbar';
import { Breadcrumb } from './Breadcrumb';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <TopNavbar />

      {/* Breadcrumb */}
      <div className="pt-16">
        <Breadcrumb />
      </div>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
