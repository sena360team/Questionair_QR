// ============================================================
// API: /api/form-versions/[id]/duplicate
// POST — คัดลอก version ที่เลือกไปเป็นฟอร์มใหม่
// Body: { title }
// Returns: { newFormId }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: versionId } = await params;
    const body = await req.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // ดึง version ที่ต้องการ copy
    const sourceVersion = await prisma.formVersion.findUnique({
      where: { id: versionId },
      include: { form: true },
    });

    if (!sourceVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // สร้าง unique slug
    const baseSlug = 'copy-' + title.toLowerCase().replace(/[^a-z0-9ก-๙]/g, '-').replace(/-+/g, '-');
    let slug = baseSlug;
    let counter = 0;
    while (await prisma.form.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // สร้าง unique code
    const code = slug.substring(0, 20).toUpperCase().replace(/-/g, '_');

    // เตรียม fields: ลบ _versionAdded ออกเพราะเป็นฟอร์มใหม่
    let cleanedFields = [];
    if (Array.isArray(sourceVersion.fields)) {
      cleanedFields = (sourceVersion.fields as any[]).map((field: any) => {
        const { _versionAdded, ...rest } = field;
        return rest;
      });
    }

    // สร้าง form ใหม่จาก version ที่เลือก
    const newForm = await prisma.form.create({
      data: {
        code,
        slug,
        title,
        description: sourceVersion.description,
        fields: cleanedFields as any,
        is_active: false,
        allow_multiple_responses: sourceVersion.form.allow_multiple_responses,
        status: 'draft',
        theme: sourceVersion.theme,
        banner_color: sourceVersion.banner_color,
        banner_custom_color: sourceVersion.banner_custom_color,
        banner_mode: sourceVersion.banner_mode,
        accent_color: sourceVersion.accent_color,
        accent_custom_color: sourceVersion.accent_custom_color,
        logo_url: sourceVersion.logo_url,
        logo_position: sourceVersion.logo_position,
        logo_size: sourceVersion.logo_size,
        require_consent: sourceVersion.require_consent,
        consent_heading: sourceVersion.consent_heading,
        consent_text: sourceVersion.consent_text,
        consent_require_location: sourceVersion.consent_require_location,
      },
    });

    return NextResponse.json({ newFormId: newForm.id }, { status: 201 });
  } catch (err: any) {
    console.error('Duplicate version error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
