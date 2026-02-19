// ============================================================
// API: Publish Draft
// POST /api/form-versions/publish
// Body: { versionId: string, changeSummary?: string }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { versionId, changeSummary } = body;
    
    if (!versionId) {
      return NextResponse.json(
        { success: false, error: 'versionId is required' },
        { status: 400 }
      );
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get draft data
    const { data: draft, error: draftError } = await supabase
      .from('form_versions')
      .select('*')
      .eq('id', versionId)
      .single();
    
    if (draftError || !draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }
    
    // Verify this is actually a draft version by checking forms.draft_version
    const { data: form } = await supabase
      .from('forms')
      .select('draft_version')
      .eq('id', draft.form_id)
      .single();
    
    if (form?.draft_version !== draft.version) {
      return NextResponse.json(
        { success: false, error: 'This version is not a draft' },
        { status: 400 }
      );
    }
    
    // Update form with draft data - include all fields
    const formUpdateData: any = {
      current_version: draft.version,
      title: draft.title,
      description: draft.description,
      fields: draft.fields,
      status: 'published',
      updated_at: new Date().toISOString(),
      // Theme and styling
      theme: draft.theme,
      banner_color: draft.banner_color,
      banner_custom_color: draft.banner_custom_color,
      banner_mode: draft.banner_mode,
      accent_color: draft.accent_color,
      accent_custom_color: draft.accent_custom_color,
      logo_position: draft.logo_position,
      logo_size: draft.logo_size,
      // Consent
      require_consent: draft.require_consent,
      consent_heading: draft.consent_heading,
      consent_text: draft.consent_text,
      consent_require_location: draft.consent_require_location,
    };
    
    // Only add optional fields if they exist in draft
    if (draft.logo_url !== undefined) formUpdateData.logo_url = draft.logo_url;
    
    const { error: updateFormError } = await supabase
      .from('forms')
      .update(formUpdateData)
      .eq('id', draft.form_id);
    
    if (updateFormError) {
      console.error('Error updating form:', updateFormError);
      return NextResponse.json(
        { success: false, error: 'Failed to publish draft' },
        { status: 500 }
      );
    }
    
    // Update version with published_at and change_summary
    const { error: updateVersionError } = await supabase
      .from('form_versions')
      .update({
        published_at: new Date().toISOString(),
        change_summary: changeSummary || draft.change_summary || `Publish version ${draft.version}`,
      })
      .eq('id', versionId);
    
    if (updateVersionError) {
      console.error('Error updating version:', updateVersionError);
    }
    
    // Clear draft_version from form
    await supabase
      .from('forms')
      .update({ draft_version: null })
      .eq('id', draft.form_id);
    
    return NextResponse.json({
      success: true,
      data: {
        version: draft.version,
        message: 'Draft published successfully',
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
