// ============================================================
// API: Update Theme Only (No Version Change)
// PATCH /api/forms/{id}/theme
// Body: { theme, banner_color, banner_custom_color, banner_mode, 
//         accent_color, accent_custom_color, logo_url, logo_position, logo_size }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      theme,
      banner_color,
      banner_custom_color,
      banner_mode,
      accent_color,
      accent_custom_color,
      logo_url,
      logo_position,
      logo_size,
    } = body;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Validate form exists
    const { data: existingForm, error: findError } = await supabase
      .from('forms')
      .select('id, title')
      .eq('id', id)
      .single();
    
    if (findError || !existingForm) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }
    
    // Build update data (only theme-related fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (theme !== undefined) updateData.theme = theme;
    if (banner_color !== undefined) updateData.banner_color = banner_color;
    if (banner_custom_color !== undefined) updateData.banner_custom_color = banner_custom_color;
    if (banner_mode !== undefined) updateData.banner_mode = banner_mode;
    if (accent_color !== undefined) updateData.accent_color = accent_color;
    if (accent_custom_color !== undefined) updateData.accent_custom_color = accent_custom_color;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (logo_position !== undefined) updateData.logo_position = logo_position;
    if (logo_size !== undefined) updateData.logo_size = logo_size;
    
    // Update form
    const { error: updateError } = await supabase
      .from('forms')
      .update(updateData)
      .eq('id', id);
    
    if (updateError) {
      console.error('Error updating theme:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message || 'Failed to update theme' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Theme applied successfully',
        updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at'),
      },
    });
    
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
