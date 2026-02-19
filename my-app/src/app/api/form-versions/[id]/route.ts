// ============================================================
// API: Update Form Version (Draft)
// PUT /api/form-versions/{id}
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Build update data - include all styling fields
    const updateData: any = {
      title: body.title,
      description: body.description,
      change_summary: body.change_summary || 'อัปเดตร่าง',
      updated_at: new Date().toISOString(),
    };
    
    // Add theme and styling fields
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.banner_color !== undefined) updateData.banner_color = body.banner_color;
    if (body.banner_custom_color !== undefined) updateData.banner_custom_color = body.banner_custom_color;
    if (body.banner_mode !== undefined) updateData.banner_mode = body.banner_mode;
    if (body.accent_color !== undefined) updateData.accent_color = body.accent_color;
    if (body.accent_custom_color !== undefined) updateData.accent_custom_color = body.accent_custom_color;
    if (body.logo_position !== undefined) updateData.logo_position = body.logo_position;
    if (body.logo_size !== undefined) updateData.logo_size = body.logo_size;
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
    if (body.require_consent !== undefined) updateData.require_consent = body.require_consent;
    if (body.consent_heading !== undefined) updateData.consent_heading = body.consent_heading;
    if (body.consent_text !== undefined) updateData.consent_text = body.consent_text;
    if (body.consent_require_location !== undefined) updateData.consent_require_location = body.consent_require_location;
    
    if (body.fields) {
      updateData.fields = body.fields;
      updateData.fields_hash = createHash('md5').update(JSON.stringify(body.fields)).digest('hex');
    }
    
    // Update version (draft check is implicit - only draft versions should be editable)
    const { data: versionData, error: versionError } = await supabase
      .from('form_versions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (versionError) {
      console.error('Error updating draft:', versionError);
      return NextResponse.json(
        { success: false, error: 'Failed to update draft' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: versionData,
    });
    
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete draft version
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get version info first
    const { data: version } = await supabase
      .from('form_versions')
      .select('form_id, version')
      .eq('id', id)
      .single();
    
    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }
    
    // Check if this version is the draft version
    const { data: form } = await supabase
      .from('forms')
      .select('draft_version')
      .eq('id', version.form_id)
      .single();
    
    if (form?.draft_version !== version.version) {
      return NextResponse.json(
        { success: false, error: 'Can only delete draft versions' },
        { status: 403 }
      );
    }
    
    // Delete draft
    const { error: deleteError } = await supabase
      .from('form_versions')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting draft:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete draft' },
        { status: 500 }
      );
    }
    
    // Clear draft_version from form
    await supabase
      .from('forms')
      .update({ draft_version: null })
      .eq('id', version.form_id);
    
    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully',
    });
    
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
