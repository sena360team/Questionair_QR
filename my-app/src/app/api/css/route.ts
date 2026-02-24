// ============================================================
// API: /api/css — Proxy สำหรับ CSS API (หลีกเลี่ยง CORS)
// POST — ส่งข้อมูล complaint ไปยัง CSS API
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

const CSS_API_URL = 'https://api-css.senxgroup.com/api/complaint-list/create-by-other';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ดึง API Key จาก app_settings ผ่าน Prisma
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'css_api_config' },
      select: { value: true },
    });

    const config = setting?.value as any;
    if (!config?.apiKey) {
      return NextResponse.json({ success: false, error: 'API Key not configured' }, { status: 400 });
    }

    const apiKey = config.apiKey.trim();

    // Trim all string values in body
    const trimmedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ])
    );

    // ส่งต่อไปยัง CSS API
    const response = await fetch(CSS_API_URL, {
      method: 'POST',
      headers: { apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(trimmedBody),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return NextResponse.json({ success: response.ok, data, status: response.status });
  } catch (error) {
    console.error('[CSS Proxy] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to call CSS API' }, { status: 500 });
  }
}
