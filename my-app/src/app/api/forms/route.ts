// ============================================================
// API: List All Forms
// GET /api/forms
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Initialize Supabase with service role key for API access
const supabase = createServerClient();

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // published | draft | archived
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let query = supabase
      .from('forms')
      .select('id, code, title, slug, description, status, current_version, is_active, created_at, updated_at, fields')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        total: count,
        limit,
        offset
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
