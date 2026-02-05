// ============================================================
// API: Get Submissions for a Form
// GET /api/forms/{id}/submissions
// GET /api/forms/{code}/submissions
// Query params:
//   - limit: number (default: 50)
//   - offset: number (default: 0)
//   - date_from: YYYY-MM-DD
//   - date_to: YYYY-MM-DD
//   - qr_code_id: filter by QR code
//   - project_id: filter by project
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const supabase = createServerClient();

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Date filters
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    // Other filters
    const qrCodeId = searchParams.get('qr_code_id');
    const projectId = searchParams.get('project_id');
    
    // First, find the form by ID, code, or slug
    let formQuery = supabase
      .from('forms')
      .select('id, code, title, fields, current_version')
      .eq('id', id)
      .single();
    
    let { data: form, error: formError } = await formQuery;
    
    // Try by code
    if (formError || !form) {
      const { data: byCode, error: errByCode } = await supabase
        .from('forms')
        .select('id, code, title, fields, current_version')
        .eq('code', id)
        .single();
      form = byCode;
      formError = errByCode;
    }
    
    // Try by slug
    if (formError || !form) {
      const { data: bySlug, error: errBySlug } = await supabase
        .from('forms')
        .select('id, code, title, fields, current_version')
        .eq('slug', id)
        .single();
      form = bySlug;
      formError = errBySlug;
    }
    
    if (formError || !form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }
    
    // Build submissions query
    let submissionsQuery = supabase
      .from('submissions')
      .select(`
        id,
        form_id,
        form_version,
        qr_code_id,
        project_id,
        responses,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        submitted_at,
        metadata,
        qr_code:qr_codes(id, name, project_id),
        project:projects(id, code, name)
      `, { count: 'exact' })
      .eq('form_id', form.id)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (dateFrom) {
      submissionsQuery = submissionsQuery.gte('submitted_at', dateFrom);
    }
    if (dateTo) {
      submissionsQuery = submissionsQuery.lte('submitted_at', dateTo + 'T23:59:59');
    }
    if (qrCodeId) {
      submissionsQuery = submissionsQuery.eq('qr_code_id', qrCodeId);
    }
    if (projectId) {
      submissionsQuery = submissionsQuery.eq('project_id', projectId);
    }
    
    const { data: submissions, error: submissionsError, count } = await submissionsQuery;
    
    if (submissionsError) {
      console.error('API Error:', submissionsError);
      return NextResponse.json(
        { success: false, error: submissionsError.message },
        { status: 500 }
      );
    }
    
    // Format response - extract field labels
    const fieldLabels = form.fields?.map((f: any) => ({
      key: f.id,
      label: f.label,
      type: f.type
    })) || [];
    
    // Format submissions for display
    const formattedSubmissions = (submissions || []).map((sub: any) => ({
      id: sub.id,
      submitted_at: sub.submitted_at,
      form_version: sub.form_version,
      responses: sub.responses,
      utm: {
        source: sub.utm_source,
        medium: sub.utm_medium,
        campaign: sub.utm_campaign,
        content: sub.utm_content,
        term: sub.utm_term
      },
      qr_code: sub.qr_code ? {
        id: sub.qr_code.id,
        name: sub.qr_code.name
      } : null,
      project: sub.project ? {
        id: sub.project.id,
        code: sub.project.code,
        name: sub.project.name
      } : null
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        form: {
          id: form.id,
          code: form.code,
          title: form.title,
          current_version: form.current_version,
          fields: fieldLabels
        },
        submissions: formattedSubmissions
      },
      meta: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    });
    
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
