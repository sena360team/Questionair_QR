// ============================================
// Version Color Generator
// สร้างสีconsistent จากเลข version
// ============================================

export const VERSION_COLORS: string[] = [
  // สีพื้นฐาน 10 สี
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  // สีเพิ่มเติม 20 สี
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#78716c', // stone-500
  '#71717a', // zinc-500
  '#6b7280', // gray-500
  '#ef4444', // red-600
  '#f97316', // orange-600
  '#f59e0b', // amber-600
  '#eab308', // yellow-600
  '#84cc16', // lime-600
  '#22c55e', // green-600
  '#10b981', // emerald-600
  '#14b8a6', // teal-600
  '#06b6d4', // cyan-600
  '#0ea5e9', // sky-600
  // สีเข้มขึ้นอีก 20 สี
  '#2563eb', // blue-600
  '#4f46e5', // indigo-600
  '#7c3aed', // violet-600
  '#9333ea', // purple-600
  '#c026d3', // fuchsia-600
  '#db2777', // pink-600
  '#e11d48', // rose-600
  '#57534e', // stone-600
  '#52525b', // zinc-600
  '#4b5563', // gray-600
  '#dc2626', // red-700
  '#ea580c', // orange-700
  '#d97706', // amber-700
  '#ca8a04', // yellow-700
  '#65a30d', // lime-700
  '#16a34a', // green-700
  '#059669', // emerald-700
  '#0d9488', // teal-700
  '#0891b2', // cyan-700
  '#0284c7', // sky-700
];

/**
 * ดึงสีจาก version number
 * Version 1 = สีดำ (default)
 * Version 2+ = สีตาม array
 */
export function getVersionColor(version: number): string | undefined {
  if (version <= 1) return undefined; // undefined = ใช้สี default (ดำ)
  const index = ((version - 2) % VERSION_COLORS.length); // เริ่มนับจาก version 2
  return VERSION_COLORS[index];
}

/**
 * ดึงสีพื้นหลังอ่อน (bg) จากสีหลัก
 * Version 0, 1 = สีเทาอ่อน
 * Version 2+ = สีตาม version
 */
export function getVersionBgColor(version: number): string {
  const color = getVersionColor(version);
  if (!color) return 'rgba(107, 114, 128, 0.15)'; // gray-500 with opacity 0.15 for v0, v1
  
  // แปลง hex เป็น rgba ด้วย opacity 0.15
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.15)`;
}

/**
 * ดึงสีตัวอักษร (text) จาก version
 * Version 1 = undefined (ใช้สี default)
 * Version 2+ = สีตาม array
 */
export function getVersionTextColor(version: number): string | undefined {
  return getVersionColor(version);
}

/**
 * สร้าง style object สำหรับ Version Badge
 * Version 0, 1 = สีเทา (default)
 * Version 2+ = สีสันสดใส
 */
export function getVersionBadgeStyle(version: number): React.CSSProperties {
  const color = getVersionColor(version);
  const bgColor = getVersionBgColor(version);
  
  // Default gray for v0, v1
  const defaultColor = '#6b7280'; // gray-500
  
  return {
    backgroundColor: bgColor,
    color: color || defaultColor,
    borderColor: color || defaultColor,
  };
}

/**
 * สร้าง className สำหรับ Version Badge (ใช้ inline style แทน tailwind)
 */
export function getVersionBadgeClass(version: number): string {
  return `px-2 py-0.5 text-xs rounded-full font-medium border`;
}
