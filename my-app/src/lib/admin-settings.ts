// ============================================================
// Admin Settings Library
// แทนที่ Supabase admin client ด้วย Prisma
// ใช้ table: app_settings สำหรับจัดเก็บการตั้งค่าระบบ
// Return: config object { contactChannelId, userCreated }
// ============================================================

import prisma from '@/lib/db';

// ดึงการตั้งค่า CSS API
// Returns: { contactChannelId: string, userCreated: string }
export async function getCSSConfig() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: 'css_api_config' },
    select: { value: true },
  });

  return (setting?.value as any) || { contactChannelId: '', userCreated: '' };
}

// บันทึกการตั้งค่า CSS API
// Parameters: config { contactChannelId: string, userCreated: string }
export async function saveCSSConfig(config: { contactChannelId: string; userCreated: string }) {
  await prisma.appSetting.upsert({
    where: { key: 'css_api_config' },
    create: { key: 'css_api_config', value: config as any },
    update: { value: config as any },
  });

  return true;
}
