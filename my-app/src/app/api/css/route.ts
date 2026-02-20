// Proxy API for CSS - avoids CORS issues
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CSS_API_URL = 'https://api-css.senxgroup.com/api/complaint-list/create-by-other';

// Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Trim all string values in body
    const trimmedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value
      ])
    );
    
    // Get API Key from database
    const { data: configData, error: configError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'css_api_config')
      .single();
    
    if (configError || !configData?.value?.apiKey) {
      console.error('[CSS Proxy] API Key not configured');
      return NextResponse.json(
        { success: false, error: 'API Key not configured' },
        { status: 400 }
      );
    }
    
    const apiKey = configData.value.apiKey?.trim();
    
    // Debug: Show partial API key
    const maskedKey = apiKey ? apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4) : 'NOT SET';
    console.log('[CSS Proxy] Using API Key:', maskedKey);
    console.log('[CSS Proxy] Forwarding request:', trimmedBody);
    
    // Use apiKey header (not Authorization Bearer) as per CSS API docs
    const response = await fetch(CSS_API_URL, {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trimmedBody),
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    
    console.log('[CSS Proxy] Response status:', response.status);
    console.log('[CSS Proxy] Response body:', data);
    
    return NextResponse.json(
      { success: response.ok, data, status: response.status },
      { status: 200 } // Always return 200 to client, check success flag
    );
    
  } catch (error) {
    console.error('[CSS Proxy] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to call CSS API' },
      { status: 500 }
    );
  }
}
