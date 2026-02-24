// ============================================================
// API Route: /api/forms
// GET  — ดึงรายการแบบสอบถามทั้งหมด (พร้อม count)
// POST — สร้างแบบสอบถามใหม่
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/forms — ดึง forms ทั้งหมดพร้อม qr_codes count และ submissions count
export async function GET(req: NextRequest) {
  try {
    const forms = await prisma.form.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { qr_codes: true, submissions: true },
        },
      },
    });

    // แปลงรูปแบบให้ตรงกับที่ Frontend ใช้อยู่
    const result = forms.map((form: any) => ({
      ...form,
      has_draft: form.draft_version !== null,
      qr_codes: [{ count: form._count.qr_codes }],
      submissions: [{ count: form._count.submissions }],
      _count: undefined,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GET /api/forms error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/forms — สร้างแบบสอบถามใหม่
// Body: { code, slug, title, description?, fields?, ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, slug, title, ...rest } = body;

    if (!code || !slug || !title) {
      return NextResponse.json({ error: 'code, slug, title are required' }, { status: 400 });
    }

    const form = await prisma.form.create({
      data: { code, slug, title, ...rest },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/forms error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Form code or slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
