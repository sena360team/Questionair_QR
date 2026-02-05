// ============================================================
// API: Get Form Details
// GET /api/forms/{id}
// GET /api/forms/{code} (e.g., FRM-001)
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
    
    // Try to find by ID first (UUID format)
    let query = supabase
      .from('forms')
      .select('id, code, title, slug, description, status, current_version, is_active, created_at, updated_at, fields')
      .eq('id', id)
      .single();
    
    let { data, error } = await query;
    
    // If not found by ID, try by code
    if (error || !data) {
      const { data: dataByCode, error: errorByCode } = await supabase
        .from('forms')
        .select('id, code, title, slug, description, status, current_version, is_active, created_at, updated_at, fields')
        .eq('code', id)
        .single();
      
      data = dataByCode;
      error = errorByCode;
    }
    
    // If still not found, try by slug
    if (error || !data) {
      const { data: dataBySlug, error: errorBySlug } = await supabase
        .from('forms')
        .select('id, code, title, slug, description, status, current_version, is_active, created_at, updated_at, fields')
        .eq('slug', id)
        .single();
      
      data = dataBySlug;
      error = errorBySlug;
    }
    
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data
    });
    
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
