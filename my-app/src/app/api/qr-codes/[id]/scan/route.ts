// ============================================================
// API: /api/qr-codes/[id]/scan
// POST — บันทึกการสแกน QR Code (เพิ่ม scan_count)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // ค้นหาด้วย id หรือ qr_slug
        const qrCode = await prisma.qrCode.findFirst({
            where: { OR: [{ id }, { qr_slug: id }] },
        });

        if (!qrCode) return NextResponse.json({ error: 'QR code not found' }, { status: 404 });

        await prisma.qrCode.update({
            where: { id: qrCode.id },
            data: { scan_count: { increment: 1 }, last_scanned_at: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
