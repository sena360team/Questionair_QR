// ============================================================
// API: Form Versions
// GET /api/form-versions?formId={id} - List versions
// POST /api/form-versions - Create new draft
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// GET - List versions by formId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    
    console.log('GET /api/form-versions called with formId:', formId);
    
    if (!formId) {
      return NextResponse.json(
        { success: false, error: 'formId is required' },
        { status: 400 }
      );
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('GET Environment check:', { url: !!supabaseUrl, keyExists: !!supabaseKey });
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get form info - try with draft_version, fallback to just current_version
    let formQuery = supabase
      .from('forms')
      .select('current_version, draft_version')
      .eq('id', formId)
      .single();
    
    let { data: form, error: formError } = await formQuery;
    
    // If draft_version column doesn't exist, retry without it
    if (formError && formError.message?.includes('draft_version')) {
      const { data: form2, error: formError2 } = await supabase
        .from('forms')
        .select('current_version')
        .eq('id', formId)
        .single();
      form = form2;
      formError = formError2;
    }
    
    if (formError || !form) {
      console.error('Form lookup error:', formError);
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }
    
    // Get all versions with full data
    const { data: versions, error: versionsError } = await supabase
      .from('form_versions')
      .select('*')
      .eq('form_id', formId)
      .order('version', { ascending: false });
    
    if (versionsError) {
      console.error('Error fetching versions:', versionsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch versions' },
        { status: 500 }
      );
    }
    
    // Find draft version using forms.draft_version
    const draftVersion = versions?.find((v: any) => v.version === form.draft_version);
    
    // Mark current version and draft
    const versionsWithStatus = (versions || []).map((v: any) => ({
      ...v,
      is_current: v.version === form.current_version,
      is_draft: v.version === form.draft_version,
      status: v.version === form.draft_version ? 'draft' : 'published',
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        current_version: form.current_version,
        draft_version: draftVersion?.version || null,
        has_draft: !!draftVersion,
        versions: versionsWithStatus,
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

// POST - Create new draft
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formId, ...draftData } = body;
    
    console.log('POST /api/form-versions called with formId:', formId);
    
    if (!formId) {
      return NextResponse.json(
        { success: false, error: 'formId is required' },
        { status: 400 }
      );
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:', { 
      url: supabaseUrl?.substring(0, 30), 
      keyExists: !!supabaseKey,
      keyPrefix: supabaseKey?.substring(0, 20)
    });
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current form data - simplified select to avoid column issues
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    
    if (formError || !form) {
      console.error('Form lookup failed:', { formId, formError, formExists: !!form });
      return NextResponse.json(
        { success: false, error: 'Form not found', details: formError?.message },
        { status: 404 }
      );
    }
    
    const newVersion = (form.current_version || 0) + 1;
    
    // Calculate fields hash
    const fields = draftData.fields || form.fields;
    const fieldsHash = createHash('md5').update(JSON.stringify(fields)).digest('hex');
    
    // Create draft version - include theme and styling fields
    const insertData: any = {
      form_id: formId,
      version: newVersion,
      title: draftData.title || form.title,
      description: draftData.description || form.description,
      fields: fields,
      fields_hash: fieldsHash,
      theme: draftData.theme || form.theme,
      banner_color: draftData.banner_color || form.banner_color,
      banner_custom_color: draftData.banner_custom_color || form.banner_custom_color,
      banner_mode: draftData.banner_mode || form.banner_mode,
      accent_color: draftData.accent_color || form.accent_color,
      accent_custom_color: draftData.accent_custom_color || form.accent_custom_color,
      logo_position: draftData.logo_position || form.logo_position,
      logo_size: draftData.logo_size || form.logo_size,
      require_consent: draftData.require_consent ?? form.require_consent,
      consent_heading: draftData.consent_heading || form.consent_heading,
      consent_text: draftData.consent_text || form.consent_text,
      consent_require_location: draftData.consent_require_location ?? form.consent_require_location,
      created_at: new Date().toISOString(),
    };
    
    // Only add optional fields if provided
    if (draftData.logo_url || form.logo_url) insertData.logo_url = draftData.logo_url || form.logo_url;
    if (draftData.change_summary) insertData.change_summary = draftData.change_summary;
    
    console.log('Inserting draft version:', { formId, newVersion, fieldsLength: JSON.stringify(fields).length, insertDataKeys: Object.keys(insertData) });
    
    const { data: versionData, error: versionError } = await supabase
      .from('form_versions')
      .insert(insertData)
      .select()
      .single();
    
    if (versionError) {
      console.error('Error creating draft:', JSON.stringify(versionError, null, 2));
      return NextResponse.json(
        { success: false, error: 'Failed to create draft', details: versionError.message, code: versionError.code },
        { status: 500 }
      );
    }
    
    // Update form to point to this draft version
    await supabase
      .from('forms')
      .update({ draft_version: newVersion })
      .eq('id', formId);
    
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
