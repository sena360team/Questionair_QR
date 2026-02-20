// Server-side only - use service role key for admin operations
// This file should ONLY be used in Server Components or API Routes

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client with service role - admin access only
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function getCSSConfig() {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'css_api_config')
    .single();
  
  if (error) throw error;
  return data?.value || { contactChannelId: '', userCreated: '' };
}

export async function saveCSSConfig(config: { contactChannelId: string; userCreated: string }) {
  const { error } = await supabaseAdmin
    .from('app_settings')
    .upsert({
      key: 'css_api_config',
      value: config,
      description: 'Configuration for CSS API',
    }, { onConflict: 'key' });
  
  if (error) throw error;
  return true;
}
