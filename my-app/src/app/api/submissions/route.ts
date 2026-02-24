// ============================================================
// API: /api/submissions
// GET — ดึง submissions (admin view) พร้อม pagination, date filter
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const formId = searchParams.get('formId');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Build where clause
        const where: any = {};
        if (formId) where.form_id = formId;
        if (dateFrom || dateTo) {
            where.submitted_at = {};
            if (dateFrom) where.submitted_at.gte = new Date(dateFrom);
            if (dateTo) where.submitted_at.lte = new Date(dateTo + 'T23:59:59');
        }

        // Run count and query in parallel
        const [total, submissions] = await Promise.all([
            prisma.submission.count({ where }),
            prisma.submission.findMany({
                where,
                include: {
                    qr_code: {
                        select: {
                            id: true,
                            name: true,
                            qr_slug: true,
                            utm_source: true,
                            utm_medium: true,
                            utm_campaign: true,
                            utm_content: true,
                            project_id: true,
                        },
                    },
                    project: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                },
                orderBy: { submitted_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return NextResponse.json({ data: submissions, total });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
