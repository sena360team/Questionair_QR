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
      form = form2 ? { ...form2, draft_version: undefined } : null;
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
    let { data: versions, error: versionsError } = await supabase
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
    
    // Deduplicate: if there are multiple unpublished entries with same version number, keep only the latest
    const versionMap = new Map<number, any[]>();
    for (const v of (versions || [])) {
      if (!v.published_at) {
        const key = v.version;
        if (!versionMap.has(key)) versionMap.set(key, []);
        versionMap.get(key)!.push(v);
      }
    }

    const duplicateIdsToRemove: string[] = [];
    for (const [, entries] of versionMap) {
      if (entries.length > 1) {
        // Keep the most recent one (first in array since sorted by version desc, but we should sort by created_at)
        entries.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        for (let i = 1; i < entries.length; i++) {
          duplicateIdsToRemove.push(entries[i].id);
        }
      }
    }

    // Remove duplicate entries in background
    if (duplicateIdsToRemove.length > 0) {
      console.log('[API form-versions] Cleaning up', duplicateIdsToRemove.length, 'duplicate draft entries');
      await supabase
        .from('form_versions')
        .delete()
        .in('id', duplicateIdsToRemove);

      // Filter out removed entries from our local array
      const removedSet = new Set(duplicateIdsToRemove);
      const cleanedVersions = (versions || []).filter((v: any) => !removedSet.has(v.id));
      versions = cleanedVersions;
    }

    // Find draft version using forms.draft_version
    // A version is a draft if: it matches forms.draft_version AND is NOT in published status
    // (published versions have version number <= current_version)
    const draftVersion = versions?.find((v: any) =>
      v.version === form.draft_version && v.version > (form.current_version || -1)
    );
    
    console.log('[API form-versions] Form draft_version:', form.draft_version, 'Found draft:', draftVersion ? {
      id: draftVersion.id,
      version: draftVersion.version,
      published_at: draftVersion.published_at
    } : 'null');

    // Debug: if form.draft_version is set but no draft found, log the versions
    if ((form.draft_version !== null && form.draft_version !== undefined) && !draftVersion) {
      console.log('[API form-versions] DEBUG: draft_version is set but no matching version found. Versions:', (versions || []).map((v: any) => ({
        id: v.id,
        version: v.version,
        published_at: v.published_at
      })));
    }
    
    // Mark current version and draft
    // A version is draft only if: matches forms.draft_version AND version > current_version
    // (We use version number relationship instead of published_at because DB auto-sets published_at)
    const versionsWithStatus = (versions || []).map((v: any) => ({
      ...v,
      is_current: v.version === form.current_version,
      is_draft: v.version === form.draft_version && v.version > (form.current_version || -1),
      status: (v.version === form.draft_version && v.version > (form.current_version || -1)) ? 'draft' : 'published',
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        current_version: form.current_version,
        draft_version: draftVersion ? draftVersion.version : null,
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

    console.log('[POST form-versions] Form loaded:', {
      formId,
      current_version: form.current_version,
      draft_version: form.draft_version,
      formKeys: Object.keys(form).filter(k => k.includes('version'))
    });
    
    // Version logic:
    // - If no published version yet (current_version is null) → create v0 (first draft)
    // - If v0 is published (current_version = 0) → create v1 (next draft)
    // - If v1 is published (current_version = 1) → create v2 (next draft)
    const newVersion = (form.current_version === null || form.current_version === undefined)
      ? 0
      : (form.current_version + 1);

    // Calculate fields hash
    const fields = draftData.fields || form.fields;
    const fieldsHash = createHash('md5').update(JSON.stringify(fields)).digest('hex');

    // Build draft data object
    const draftFields: any = {
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
    };

    // Only add optional fields if provided
    if (draftData.logo_url || form.logo_url) draftFields.logo_url = draftData.logo_url || form.logo_url;
    if (draftData.change_summary) draftFields.change_summary = draftData.change_summary;

    // Check if a draft already exists for this form (prevent duplicates)
    // A draft is a version where version > current_version and matches draft_version
    if (form.draft_version !== null && form.draft_version !== undefined) {
      const { data: existingDraft } = await supabase
        .from('form_versions')
        .select('*')
        .eq('form_id', formId)
        .eq('version', form.draft_version)
        .limit(1)
        .single();

      if (existingDraft) {
        console.log('Updating existing draft:', { formId, version: form.draft_version, draftId: existingDraft.id });

        // Update existing draft instead of creating a duplicate
        const { data: updatedDraft, error: updateError } = await supabase
          .from('form_versions')
          .update(draftFields)
          .eq('id', existingDraft.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating existing draft:', JSON.stringify(updateError, null, 2));
          return NextResponse.json(
            { success: false, error: 'Failed to update draft', details: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedDraft,
        });
      }

      // Draft version pointer exists but no matching record found
      // This shouldn't happen, but continue anyway
      console.log('Draft pointer exists but no record found, creating new');
    }

    // Also clean up any existing versions with the same newVersion number (safety check)
    const { data: duplicates } = await supabase
      .from('form_versions')
      .select('id')
      .eq('form_id', formId)
      .eq('version', newVersion);

    if (duplicates && duplicates.length > 0) {
      console.log('Cleaning up', duplicates.length, 'duplicate v' + newVersion, 'entries');
      await supabase
        .from('form_versions')
        .delete()
        .eq('form_id', formId)
        .eq('version', newVersion);
    }

    // Create new draft version
    const insertData = {
      ...draftFields,
      form_id: formId,
      version: newVersion,
      created_at: new Date().toISOString(),
      published_at: null,  // Explicitly set to null for draft
    };

    console.log('Inserting new draft version:', { formId, newVersion, fieldsLength: JSON.stringify(fields).length });

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
    const { error: updateError } = await supabase
      .from('forms')
      .update({ draft_version: newVersion })
      .eq('id', formId);

    if (updateError) {
      console.error('Error updating draft_version:', JSON.stringify(updateError, null, 2));
      return NextResponse.json(
        { success: false, error: 'Failed to update draft pointer', details: updateError.message },
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
