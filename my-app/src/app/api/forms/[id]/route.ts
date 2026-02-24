// ============================================================
// API Route: /api/forms/[id]
// GET    — ดึงแบบสอบถามตาม ID
// PUT    — อัพเดทแบบสอบถาม
// DELETE — ลบแบบสอบถาม
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/forms/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // รองรับทั้ง id และ slug
    const form = await prisma.form.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        versions: { orderBy: { version: 'desc' } },
        draft: true,
        _count: { select: { qr_codes: true, submissions: true } },
      },
    });

    if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(form);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/forms/[id] — อัพเดทแบบสอบถาม
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // ลบ field ที่ไม่ใช่ column ของ Form model
    const { _count, qr_codes, submissions, versions, draft, has_draft, ...data } = body;

    const form = await prisma.form.update({
      where: { id },
      data,
    });

    return NextResponse.json(form);
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/forms/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.form.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
