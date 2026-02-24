// ============================================================
// API: /api/forms/[id]/duplicate
// POST — คัดลอกแบบสอบถาม (แทน Supabase RPC duplicate_form)
// Body: { title, copy_questions?, copy_settings?, copy_logo? }
// Returns: { newFormId }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { title, copy_questions = true, copy_settings = true, copy_logo = true } = body;

        if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

        // ดึง form ต้นแบบ
        const source = await prisma.form.findUnique({ where: { id } });
        if (!source) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

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

        // เตรียม fields: ลบ _versionAdded ออกเพราะเป็นฟอร์มใหม่ (draft, ยังไม่ publish)
        let cleanedFields = [];
        if (copy_questions && Array.isArray(source.fields)) {
            cleanedFields = (source.fields as any[]).map((field: any) => {
                const { _versionAdded, ...rest } = field;
                return rest;
            });
        }

        // สร้าง form ใหม่
        const newForm = await prisma.form.create({
            data: {
                code,
                slug,
                title,
                description: copy_settings ? source.description : null,
                fields: cleanedFields as any,
                is_active: false,
                allow_multiple_responses: source.allow_multiple_responses,
                status: 'draft',
                theme: copy_settings ? source.theme : null,
                banner_color: copy_settings ? source.banner_color : null,
                banner_custom_color: copy_settings ? source.banner_custom_color : null,
                banner_mode: copy_settings ? source.banner_mode : null,
                accent_color: copy_settings ? source.accent_color : null,
                accent_custom_color: copy_settings ? source.accent_custom_color : null,
                logo_url: copy_logo ? source.logo_url : null,
                logo_position: copy_logo ? source.logo_position : null,
                logo_size: copy_logo ? source.logo_size : null,
                require_consent: copy_settings ? source.require_consent : false,
                consent_heading: copy_settings ? source.consent_heading : null,
                consent_text: copy_settings ? source.consent_text : null,
                consent_require_location: copy_settings ? source.consent_require_location : false,
            },
        });

        return NextResponse.json({ newFormId: newForm.id }, { status: 201 });
    } catch (err: any) {
        console.error('Duplicate form error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
