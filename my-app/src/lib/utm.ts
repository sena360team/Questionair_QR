// ============================================================
// UTM Tracking Utilities
// ============================================================

import { UTMParams } from '@/types';

// UTM Parameter keys ที่ใช้ในระบบ
export const UTM_KEYS = [
  'utm_source',
  'utm_medium', 
  'utm_campaign',
  'utm_content',
  'utm_term'
] as const;

/**
 * ดึง UTM parameters จาก URL query string
 */
export function getUTMParamsFromURL(url?: string): UTMParams {
  if (typeof window === 'undefined' && !url) {
    return {};
  }

  const searchParams = url 
    ? new URL(url).searchParams
    : new URLSearchParams(window.location.search);

  const params: UTMParams = {};

  UTM_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) {
      params[key] = decodeURIComponent(value);
    }
  });

  return params;
}

/**
 * สร้าง URL พร้อม UTM parameters
 */
export function buildURLWithUTM(
  baseUrl: string, 
  params: UTMParams
): string {
  const url = new URL(baseUrl, baseUrl.startsWith('http') ? undefined : 'http://localhost');
  
  Object.entries(params).forEach(([key, value]) => {
    if (value && UTM_KEYS.includes(key as typeof UTM_KEYS[number])) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString().replace(/^http:\/\/localhost/, '');
}

/**
 * สร้าง UTM parameters สำหรับ QR Code
 */
export function buildQRCodeUTM(
  qrName: string,
  location?: string,
  customParams?: Partial<UTMParams>
): UTMParams {
  return {
    utm_source: customParams?.utm_source || 'qr_code',
    utm_medium: customParams?.utm_medium || 'offline',
    utm_campaign: customParams?.utm_campaign || qrName,
    utm_content: customParams?.utm_content || location,
    utm_term: customParams?.utm_term
  };
}

/**
 * เก็บ UTM parameters ไว้ใน sessionStorage (กรณี redirect)
 */
export function storeUTMInSession(params: UTMParams): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem('utm_params', JSON.stringify(params));
  } catch (e) {
    console.error('Failed to store UTM params:', e);
  }
}

/**
 * ดึง UTM parameters จาก sessionStorage
 */
export function getUTMFromSession(): UTMParams {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = sessionStorage.getItem('utm_params');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to get UTM params from session:', e);
  }
  
  return {};
}

/**
 * ล้าง UTM parameters จาก sessionStorage
 */
export function clearUTMSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem('utm_params');
  } catch (e) {
    console.error('Failed to clear UTM session:', e);
  }
}

/**
 * รวม UTM parameters (priority ให้ source ใหม่)
 */
export function mergeUTMParams(
  base: UTMParams,
  override: UTMParams
): UTMParams {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(override).filter(([_, v]) => v !== undefined && v !== null)
    )
  };
}

/**
 * ตรวจสอบว่ามี UTM params หรือไม่
 */
export function hasUTMParams(params: UTMParams): boolean {
  return Object.values(params).some(v => v !== undefined && v !== null && v !== '');
}

/**
 * แปลง UTM params เป็น readable string (สำหรับแสดงผล)
 */
export function formatUTMForDisplay(params: UTMParams): string {
  const parts: string[] = [];
  
  if (params.utm_source) parts.push(`Source: ${params.utm_source}`);
  if (params.utm_medium) parts.push(`Medium: ${params.utm_medium}`);
  if (params.utm_campaign) parts.push(`Campaign: ${params.utm_campaign}`);
  if (params.utm_content) parts.push(`Content: ${params.utm_content}`);
  if (params.utm_term) parts.push(`Term: ${params.utm_term}`);
  
  return parts.join(' | ') || 'ไม่มี UTM';
}
