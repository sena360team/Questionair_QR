// ============================================================
// API: /api/forms/[id]/submissions
// GET  — ดึง submissions ของ form (พร้อม pagination, filter)
// POST — สร้าง submission ใหม่ (ตอบแบบสอบถาม)
// Query params: limit, offset, date_from, date_to, qr_code_id, project_id
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/forms/[id]/submissions
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filters
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const qrCodeId = searchParams.get('qr_code_id');
    const projectId = searchParams.get('project_id');

    // ค้นหา form จาก id หรือ slug หรือ code
    const form = await prisma.form.findFirst({
      where: { OR: [{ id }, { slug: id }, { code: id }] },
      select: { id: true, code: true, title: true, fields: true, current_version: true },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Build filter conditions
    const where: any = { form_id: form.id };
    if (dateFrom || dateTo) {
      where.submitted_at = {};
      if (dateFrom) where.submitted_at.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.submitted_at.lte = end;
      }
    }
    if (qrCodeId) where.qr_code_id = qrCodeId;
    if (projectId) where.project_id = projectId;

    // ดึง submissions
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { submitted_at: 'desc' },
        include: {
          qr_code: { select: { name: true, qr_slug: true } },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    return NextResponse.json({
      form,
      submissions,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error: any) {
    console.error('GET /api/forms/[id]/submissions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/forms/[id]/submissions — ส่งคำตอบแบบสอบถาม
// Body: { responses, qr_code_id?, project_id?, utm_*, fingerprint?, metadata? }
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // ค้นหา form
    const form = await prisma.form.findFirst({
      where: { OR: [{ id }, { slug: id }], is_active: true },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
    }

    // สร้าง submission
    const submission = await prisma.submission.create({
      data: {
        form_id: form.id,
        form_version: form.current_version,
        qr_code_id: body.qr_code_id || null,
        project_id: body.project_id || null,
        responses: body.responses || {},
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        utm_content: body.utm_content || null,
        utm_term: body.utm_term || null,
        fingerprint: body.fingerprint || null,
        metadata: body.metadata || null,
      },
    });

    // เพิ่ม scan count ถ้ามาจาก QR
    if (body.qr_code_id) {
      await prisma.qrCode.update({
        where: { id: body.qr_code_id },
        data: { scan_count: { increment: 1 } },
      }).catch(() => { });
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/forms/[id]/submissions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
