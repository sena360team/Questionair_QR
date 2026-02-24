// ============================================================
// API: /api/forms/[id]/toggle-active
// PATCH — เปิด/ปิดการใช้งานแบบสอบถาม (is_active)
// Body: { is_active: boolean }
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { is_active } = body;

    const form = await prisma.form.update({
      where: { id },
      data: { is_active },
    });

    return NextResponse.json({ success: true, data: form });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
