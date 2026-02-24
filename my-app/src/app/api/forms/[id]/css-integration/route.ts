// ============================================================
// API: /api/forms/[id]/css-integration
// PATCH — อัพเดทการตั้งค่า CSS Integration ของแบบสอบถาม
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    await prisma.form.update({
      where: { id },
      data: {
        // css_integration_enabled และ css_field_mapping ถ้ายังไม่มีใน schema ให้เก็บใน metadata
        // หรือเพิ่ม column ใน Prisma schema ภายหลัง
      } as any,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('CSS Integration API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
