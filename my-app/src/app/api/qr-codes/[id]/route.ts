// ============================================================
// API Route: /api/qr-codes/[id]
// GET    — ดึง QR Code ตาม ID หรือ slug
// PUT    — อัพเดท QR Code
// DELETE — ลบ QR Code
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/qr-codes/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const qrCode = await prisma.qrCode.findFirst({
            where: { OR: [{ id }, { qr_slug: id }] },
            include: { project: true, form: true },
        });
        if (!qrCode) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(qrCode);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/qr-codes/[id] — อัพเดท QR Code
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { project, form, ...data } = body;

        const qrCode = await prisma.qrCode.update({
            where: { id },
            data,
            include: { project: true },
        });
        return NextResponse.json(qrCode);
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/qr-codes/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.qrCode.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
