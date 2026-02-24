// ============================================================
// API: /api/form-versions
// GET  — ดึง versions ของ form ตาม formId
// POST — สร้าง form version ใหม่
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');

    if (!formId) {
      return NextResponse.json({ error: 'formId is required' }, { status: 400 });
    }

    // ดึง form เพื่อรู้ current_version และ draft_version
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { current_version: true, draft_version: true },
    });

    const versions = await prisma.formVersion.findMany({
      where: { form_id: formId },
      orderBy: { version: 'desc' },
    });

    // เพิ่ม is_draft flag ตาม form.draft_version
    const versionsWithDraftFlag = versions.map((v: any) => ({
      ...v,
      is_draft: form?.draft_version === v.version,
    }));

    return NextResponse.json({
      success: true,
      data: {
        versions: versionsWithDraftFlag,
        current_version: form?.current_version ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      form_id, version, fields, title, description, logo_url, theme,
      require_consent, consent_heading, consent_text, consent_require_location,
      change_summary, published_at,
    } = body;

    const formVersion = await prisma.formVersion.create({
      data: {
        form_id, version, fields: fields || [],
        title, description, logo_url, theme,
        require_consent, consent_heading, consent_text, consent_require_location,
        change_summary,
        published_at: published_at ? new Date(published_at) : new Date(),
        status: 'published',
      },
    });

    return NextResponse.json({ success: true, data: formVersion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
