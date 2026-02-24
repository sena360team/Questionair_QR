// ============================================================
// API Route: /api/projects/[id]
// GET    — ดึงโครงการตาม ID
// PUT    — อัพเดทโครงการ
// DELETE — ลบโครงการ
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/projects/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(project);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/projects/[id]
// Body: { code?, name?, description?, is_active? }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const project = await prisma.project.update({
            where: { id },
            data: body,
        });
        return NextResponse.json(project);
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/projects/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.project.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
