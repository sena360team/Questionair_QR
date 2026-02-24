// ============================================================
// API: /api/forms/[id]/theme
// PATCH — อัพเดทเฉพาะ theme settings (ไม่สร้าง version ใหม่)
// Body: { theme, banner_color, banner_custom_color, banner_mode,
//         accent_color, accent_custom_color, logo_url, logo_position, logo_size }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      theme, banner_color, banner_custom_color, banner_mode,
      accent_color, accent_custom_color, logo_url, logo_position, logo_size,
    } = body;

    // Build update data (เฉพาะ theme-related fields)
    const updateData: any = {};
    if (theme !== undefined) updateData.theme = theme;
    if (banner_color !== undefined) updateData.banner_color = banner_color;
    if (banner_custom_color !== undefined) updateData.banner_custom_color = banner_custom_color;
    if (banner_mode !== undefined) updateData.banner_mode = banner_mode;
    if (accent_color !== undefined) updateData.accent_color = accent_color;
    if (accent_custom_color !== undefined) updateData.accent_custom_color = accent_custom_color;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (logo_position !== undefined) updateData.logo_position = logo_position;
    if (logo_size !== undefined) updateData.logo_size = logo_size;

    await prisma.form.update({ where: { id }, data: updateData });

    return NextResponse.json({
      success: true,
      data: { message: 'Theme applied successfully', updated_fields: Object.keys(updateData) },
    });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
