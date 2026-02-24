// ============================================================
// API: /api/form-versions/publish
// POST — Publish draft version ให้กลายเป็น published
// Body: { versionId, changeSummary? }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { versionId, changeSummary } = body;

    if (!versionId) {
      return NextResponse.json({ success: false, error: 'versionId is required' }, { status: 400 });
    }

    // ดึง draft version
    const draft = await prisma.formVersion.findUnique({ where: { id: versionId } });
    if (!draft) {
      return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
    }

    // ตรวจสอบว่าเป็น draft จริง
    const form = await prisma.form.findUnique({
      where: { id: draft.form_id },
      select: { draft_version: true },
    });

    if (form?.draft_version !== draft.version) {
      return NextResponse.json({ success: false, error: 'This version is not a draft' }, { status: 400 });
    }

    // อัพเดท form ด้วยข้อมูลจาก draft
    await prisma.form.update({
      where: { id: draft.form_id },
      data: {
        current_version: draft.version,
        draft_version: null,
        status: 'published',
        title: draft.title ?? undefined,
        description: draft.description,
        fields: draft.fields ?? undefined,
        theme: draft.theme,
        banner_color: draft.banner_color,
        banner_custom_color: draft.banner_custom_color,
        banner_mode: draft.banner_mode,
        accent_color: draft.accent_color,
        accent_custom_color: draft.accent_custom_color,
        logo_url: draft.logo_url,
        logo_position: draft.logo_position,
        logo_size: draft.logo_size,
        require_consent: draft.require_consent,
        consent_heading: draft.consent_heading,
        consent_text: draft.consent_text,
        consent_require_location: draft.consent_require_location,
      },
    });

    // อัพเดท version ด้วย published_at
    await prisma.formVersion.update({
      where: { id: versionId },
      data: {
        published_at: new Date(),
        status: 'published',
        change_summary: changeSummary || draft.change_summary || `Publish version ${draft.version}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: { version: draft.version, message: 'Draft published successfully' },
    });
  } catch (err: any) {
    console.error('Publish error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
