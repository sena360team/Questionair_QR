// ============================================================
// API: /api/forms/[id]/qr-codes
// GET  — ดึง QR Codes ของ form
// POST — สร้าง QR Code ใหม่สำหรับ form
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // ค้นหา form
    const form = await prisma.form.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    const qrCodes = await prisma.qrCode.findMany({
      where: { form_id: form.id },
      include: { project: true },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(qrCodes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const form = await prisma.form.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    const qrCode = await prisma.qrCode.create({
      data: { ...body, form_id: form.id },
      include: { project: true },
    });

    return NextResponse.json(qrCode, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'QR slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
