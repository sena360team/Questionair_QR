// Test API: Create a new form and publish it
// GET /api/test-create-form

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Create a new form
    const timestamp = new Date().toISOString();
    const formData = {
      title: `Test Form ${timestamp.slice(0, 19)}`,
      description: 'Test form for version checking',
      fields: [
        { id: '1', type: 'text', label: 'Name', required: true },
        { id: '2', type: 'email', label: 'Email', required: true }
      ],
      theme: 'light',
      banner_color: 'blue',
      current_version: 1,
      status: 'draft',
      created_at: timestamp,
      updated_at: timestamp,
    };
    
    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert(formData)
      .select()
      .single();
    
    if (formError || !form) {
      return NextResponse.json({ success: false, error: formError?.message }, { status: 500 });
    }
    
    console.log('[Test] Created form:', form.id, 'with current_version:', form.current_version);
    
    // 2. Create version 1 as draft
    const fieldsHash = createHash('md5').update(JSON.stringify(formData.fields)).digest('hex');
    const { data: version, error: versionError } = await supabase
      .from('form_versions')
      .insert({
        form_id: form.id,
        version: 1,
        title: formData.title,
        description: formData.description,
        fields: formData.fields,
        fields_hash: fieldsHash,
        theme: formData.theme,
        banner_color: formData.banner_color,
        created_at: timestamp,
      })
      .select()
      .single();
    
    if (versionError || !version) {
      return NextResponse.json({ success: false, error: versionError?.message }, { status: 500 });
    }
    
    console.log('[Test] Created version 1:', version.id);
    
    // 3. Set draft_version on form
    await supabase
      .from('forms')
      .update({ draft_version: 1 })
      .eq('id', form.id);
    
    // 4. Publish the version
    const publishTime = new Date().toISOString();
    
    // Update form
    await supabase
      .from('forms')
      .update({
        current_version: 1,
        status: 'published',
        draft_version: null, // Clear draft
        updated_at: publishTime,
      })
      .eq('id', form.id);
    
    // Update version with published_at
    await supabase
      .from('form_versions')
      .update({
        published_at: publishTime,
        change_summary: 'Initial publish',
      })
      .eq('id', version.id);
    
    console.log('[Test] Published version 1 at:', publishTime);
    
    // 5. Verify the result
    const { data: finalForm } = await supabase
      .from('forms')
      .select('id, title, current_version, draft_version, status')
      .eq('id', form.id)
      .single();
    
    const { data: finalVersion } = await supabase
      .from('form_versions')
      .select('id, version, published_at, change_summary')
      .eq('id', version.id)
      .single();
    
    return NextResponse.json({
      success: true,
      message: 'Test form created and published',
      form: finalForm,
      version: finalVersion,
      check: {
        draft_version_should_be_null: finalForm?.draft_version === null,
        current_version_should_be_1: finalForm?.current_version === 1,
        version_should_have_published_at: !!finalVersion?.published_at,
      }
    });
    
  } catch (err: any) {
    console.error('Test Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
