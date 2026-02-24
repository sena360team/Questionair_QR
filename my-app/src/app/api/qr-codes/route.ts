// ============================================================
// API Route: /api/qr-codes
// GET  — ดึงรายการ QR Codes (กรองตาม formId ได้)
// POST — สร้าง QR Code ใหม่
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/qr-codes?formId=xxx
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const formId = searchParams.get('formId');

        const qrCodes = await prisma.qrCode.findMany({
            where: formId ? { form_id: formId } : undefined,
            include: { project: true },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json(qrCodes);
    } catch (error: any) {
        console.error('GET /api/qr-codes error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/qr-codes — สร้าง QR Code ใหม่
// Body: { form_id, name, qr_slug, project_id?, utm_source?, utm_medium?, utm_campaign?, utm_content?, utm_term? }
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { form_id, name, qr_slug } = body;

        if (!form_id || !name || !qr_slug) {
            return NextResponse.json({ error: 'form_id, name, qr_slug are required' }, { status: 400 });
        }

        const qrCode = await prisma.qrCode.create({
            data: body,
            include: { project: true },
        });

        return NextResponse.json(qrCode, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/qr-codes error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'QR slug already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
