// ============================================================
// API: /api/form-draft/[formId]
// GET    — ดึง draft ของ form
// PUT    — บันทึก/อัพเดท draft
// PATCH  — เปลี่ยนสถานะ draft (submit, approve, reject)
// DELETE — ลบ draft
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

type Params = { params: Promise<{ formId: string }> };

// GET /api/form-draft/[formId]
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { formId } = await params;
        const draft = await prisma.formDraft.findUnique({ where: { form_id: formId } });
        if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(draft);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT /api/form-draft/[formId] — บันทึก/สร้าง draft
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { formId } = await params;
        const body = await req.json();
        const { status, ...data } = body;

        const draft = await prisma.formDraft.upsert({
            where: { form_id: formId },
            create: { form_id: formId, status: status || 'editing', ...data },
            update: { status: status || 'editing', ...data },
        });

        return NextResponse.json(draft);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH /api/form-draft/[formId] — เปลี่ยนสถานะ
// Body: { action: 'submit'|'approve'|'reject', notes?, reviewNotes? }
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { formId } = await params;
        const { action, notes, reviewNotes } = await req.json();

        const statusMap: Record<string, string> = {
            submit: 'pending_review',
            approve: 'approved',
            reject: 'rejected',
        };

        if (!statusMap[action]) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updateData: any = { status: statusMap[action] };
        if (action === 'submit') {
            updateData.submitted_at = new Date();
            updateData.submitted_notes = notes || null;
        } else {
            updateData.reviewed_at = new Date();
            updateData.review_notes = reviewNotes || null;
        }

        const draft = await prisma.formDraft.update({
            where: { form_id: formId },
            data: updateData,
        });

        return NextResponse.json(draft);
    } catch (err: any) {
        if (err.code === 'P2025') return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/form-draft/[formId]
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { formId } = await params;
        await prisma.formDraft.delete({ where: { form_id: formId } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
