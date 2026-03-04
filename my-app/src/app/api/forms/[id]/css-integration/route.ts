// ============================================================
// API: /api/forms/[id]/css-integration
// PATCH — อัพเดทการตั้งค่า CSS Integration ของแบบสอบถาม
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { css_integration_enabled, css_field_mapping } = body;

    const updatedForm = await prisma.form.update({
      where: { id },
      data: {
        css_integration_enabled: css_integration_enabled ?? false,
        css_field_mapping: css_field_mapping || {},
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        css_integration_enabled: updatedForm.css_integration_enabled,
        css_field_mapping: updatedForm.css_field_mapping
      }
    });
  } catch (err: any) {
    console.error('CSS Integration API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
