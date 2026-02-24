// ============================================================
// API: /api/forms/[id]/new-version
// POST — สร้าง version ใหม่หลังจาก published แล้ว
// Body: { changeSummary? }
// Returns: { version }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const changeSummary = body.changeSummary || 'สร้าง version ใหม่';

        const form = await prisma.form.findUnique({ where: { id } });
        if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

        const nextVersion = (form.current_version ?? 0) + 1;

        await prisma.formVersion.create({
            data: {
                form_id: id,
                version: nextVersion,
                status: 'published',
                title: form.title,
                description: form.description,
                fields: form.fields as any,
                change_summary: changeSummary,
                published_at: new Date(),
                theme: form.theme,
                banner_color: form.banner_color,
                banner_custom_color: form.banner_custom_color,
                banner_mode: form.banner_mode,
                accent_color: form.accent_color,
                accent_custom_color: form.accent_custom_color,
                logo_url: form.logo_url,
                logo_position: form.logo_position,
                logo_size: form.logo_size,
                require_consent: form.require_consent,
                consent_heading: form.consent_heading,
                consent_text: form.consent_text,
                consent_require_location: form.consent_require_location,
            },
        });

        await prisma.form.update({
            where: { id },
            data: { current_version: nextVersion, draft_version: null },
        });

        await prisma.formDraft.deleteMany({ where: { form_id: id } });

        return NextResponse.json({ version: nextVersion });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
