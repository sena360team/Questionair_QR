// ============================================================
// API: /api/form-versions
// GET  — ดึง versions ของ form ตาม formId
// POST — สร้าง form version ใหม่ (draft หรือ published)
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

    // ดึง form เพื่อรู้ current_version, draft_version, status
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { current_version: true, draft_version: true, status: true },
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
        current_version: form?.current_version ?? null,
        form_status: form?.status ?? 'draft',
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
      formId, form_id, version, isDraft, fields, title, description,
      logo_url, logo_position, logo_size, theme,
      banner_color, banner_custom_color, banner_mode, accent_color, accent_custom_color,
      require_consent, consent_heading, consent_text, consent_require_location,
      change_summary, published_at,
    } = body;

    // Support both formId and form_id
    const actualFormId = formId || form_id;
    if (!actualFormId) {
      return NextResponse.json({ error: 'formId is required' }, { status: 400 });
    }

    // ดึง form เพื่อคำนวณ version ถัดไป
    const form = await prisma.form.findUnique({
      where: { id: actualFormId },
      select: { current_version: true, draft_version: true },
    });

    // คำนวณ version: ถ้าส่งมาใช้ตามนั้น ถ้าไม่ส่ง = current_version + 1 (เริ่มที่ 1)
    const computedVersion = version ?? ((form?.current_version ?? 0) + 1);

    if (isDraft) {
      // === สร้าง Draft Version ===
      // ตรวจสอบว่ามี draft อยู่แล้วหรือไม่
      if (form?.draft_version !== null && form?.draft_version !== undefined) {
        return NextResponse.json({
          success: false,
          error: 'Draft already exists. Update the existing draft instead.',
        }, { status: 409 });
      }

      const formVersion = await prisma.formVersion.create({
        data: {
          form_id: actualFormId,
          version: computedVersion,
          fields: fields || [],
          title, description, logo_url, logo_position, logo_size, theme,
          banner_color, banner_custom_color, banner_mode, accent_color, accent_custom_color,
          require_consent, consent_heading, consent_text, consent_require_location,
          change_summary,
          published_at: null,
          status: 'draft',
        },
      });

      // อัพเดท form.draft_version
      await prisma.form.update({
        where: { id: actualFormId },
        data: { draft_version: computedVersion },
      });

      return NextResponse.json({ success: true, data: formVersion });
    } else {
      // === สร้าง Published Version ===
      const formVersion = await prisma.formVersion.create({
        data: {
          form_id: actualFormId,
          version: computedVersion,
          fields: fields || [],
          title, description, logo_url, logo_position, logo_size, theme,
          banner_color, banner_custom_color, banner_mode, accent_color, accent_custom_color,
          require_consent, consent_heading, consent_text, consent_require_location,
          change_summary,
          published_at: published_at ? new Date(published_at) : new Date(),
          status: 'published',
        },
      });

      return NextResponse.json({ success: true, data: formVersion });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
