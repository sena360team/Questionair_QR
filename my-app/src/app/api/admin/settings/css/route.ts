// ============================================================
// API: /api/admin/settings/css
// GET  — ดึงการตั้งค่า CSS API
// PUT  — อัพเดทการตั้งค่า CSS API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const setting = await prisma.appSetting.findUnique({
            where: { key: 'css_api_config' },
            select: { value: true },
        });

        const config = (setting?.value as any) || { apiKey: '', contactChannelId: '', userCreated: '' };
        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();

        await prisma.appSetting.upsert({
            where: { key: 'css_api_config' },
            create: {
                key: 'css_api_config',
                value: body,
            },
            update: {
                value: body,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
