// ============================================================
// Prisma Client Singleton
// แทนที่ Supabase Client เดิม ใช้เชื่อมต่อ PostgreSQL โดยตรง
// ใช้ singleton pattern เพื่อไม่ให้สร้าง connection หลายตัวใน dev mode
// ============================================================

import { PrismaClient } from '@prisma/client';

// ประกาศ global type เพื่อเก็บ PrismaClient instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// สร้าง PrismaClient instance (singleton)
// - development: ใช้ instance เดิมจาก global เพื่อหลีกเลี่ยง hot-reload สร้าง connection เกิน
// - production: สร้าง instance ใหม่ทุกครั้ง
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
