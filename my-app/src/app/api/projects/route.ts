// ============================================================
// API Route: /api/projects
// GET  — ดึงรายการโครงการทั้งหมด
// POST — สร้างโครงการใหม่
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/projects — ดึงรายการโครงการทั้งหมด
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get('active') === 'true';

        const projects = await prisma.project.findMany({
            where: activeOnly ? { is_active: true } : undefined,
            orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
        });

        return NextResponse.json(projects);
    } catch (error: any) {
        console.error('GET /api/projects error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/projects — สร้างโครงการใหม่
// Body: { code, name, description?, is_active? }
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, name, description, is_active } = body;

        if (!code || !name) {
            return NextResponse.json({ error: 'code and name are required' }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: { code, name, description, is_active: is_active ?? true },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/projects error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Project code already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
