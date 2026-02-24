// ============================================================
// API: /api/form-versions/[id]
// PUT    — อัพเดท draft version
// DELETE — ลบ draft version
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params { params: Promise<{ id: string }> }

// PUT /api/form-versions/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {
      title: body.title,
      description: body.description,
      change_summary: body.change_summary || 'อัปเดตร่าง',
    };

    if (body.fields) updateData.fields = body.fields;
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.banner_color !== undefined) updateData.banner_color = body.banner_color;
    if (body.banner_custom_color !== undefined) updateData.banner_custom_color = body.banner_custom_color;
    if (body.banner_mode !== undefined) updateData.banner_mode = body.banner_mode;
    if (body.accent_color !== undefined) updateData.accent_color = body.accent_color;
    if (body.accent_custom_color !== undefined) updateData.accent_custom_color = body.accent_custom_color;
    if (body.logo_position !== undefined) updateData.logo_position = body.logo_position;
    if (body.logo_size !== undefined) updateData.logo_size = body.logo_size;
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
    if (body.require_consent !== undefined) updateData.require_consent = body.require_consent;
    if (body.consent_heading !== undefined) updateData.consent_heading = body.consent_heading;
    if (body.consent_text !== undefined) updateData.consent_text = body.consent_text;
    if (body.consent_require_location !== undefined) updateData.consent_require_location = body.consent_require_location;

    const version = await prisma.formVersion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: version });
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/form-versions/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const version = await prisma.formVersion.findUnique({
      where: { id },
      select: { form_id: true, version: true },
    });

    if (!version) return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });

    // ตรวจสอบว่าเป็น draft version
    const form = await prisma.form.findUnique({
      where: { id: version.form_id },
      select: { draft_version: true },
    });

    if (form?.draft_version !== version.version) {
      return NextResponse.json({ success: false, error: 'Can only delete draft versions' }, { status: 403 });
    }

    // ลบ draft
    await prisma.formVersion.delete({ where: { id } });
    await prisma.form.update({
      where: { id: version.form_id },
      data: { draft_version: null },
    });

    return NextResponse.json({ success: true, message: 'Draft deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
