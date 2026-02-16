// ============================================================
// API: Get QR Codes by Form ID
// GET /api/forms/{id}/qr-codes
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
    
    // Get QR codes by form_id
    const { data, error } = await supabase
      .from('qr_codes')
      .select(`
        id,
        name,
        qr_slug,
        qr_image_url,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        scan_count,
        last_scanned_at,
        created_at,
        project:project_id (
          id,
          name
        )
      `)
      .eq('form_id', id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching QR codes:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch QR codes' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data || []
    });
    
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
