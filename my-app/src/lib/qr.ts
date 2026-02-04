// ============================================================
// QR Code Utilities
// ============================================================

import QRCode from 'qrcode';
import { UTMParams, QRCode as QRCodeType } from '@/types';
import { buildURLWithUTM } from './utm';

/**
 * สร้าง QR Code Data URL (base64 image)
 */
export async function generateQRCodeDataURL(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    type: 'image/png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    ...options
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (error) {
    console.error('QR Code generation failed:', error);
    throw new Error('Failed to generate QR Code');
  }
}

/**
 * สร้าง QR Code SVG string
 */
export async function generateQRCodeSVG(
  text: string,
  options?: QRCode.QRCodeToStringOptions
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToStringOptions = {
    type: 'svg',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    ...options
  };

  try {
    return await QRCode.toString(text, defaultOptions);
  } catch (error) {
    console.error('QR Code SVG generation failed:', error);
    throw new Error('Failed to generate QR Code SVG');
  }
}

/**
 * สร้าง URL สำหรับ QR Code (Dynamic QR)
 * 
 * URL นี้จะชี้ไปที่ /qr/[qr_slug] ซึ่งเป็น redirect service
 * ทำให้สามารถเปลี่ยนลิงก์ปลายทางได้โดยไม่ต้องสร้าง QR ใหม่
 */
export function buildQRRedirectURL(
  baseUrl: string,
  qrSlug: string,
  utmParams?: UTMParams
): string {
  const redirectPath = `/qr/${qrSlug}`;
  const fullUrl = `${baseUrl.replace(/\/$/, '')}${redirectPath}`;
  
  if (utmParams) {
    return buildURLWithUTM(fullUrl, utmParams);
  }
  
  return fullUrl;
}

/**
 * สร้าง slug ที่ปลอดภัยสำหรับ QR Code
 */
export function generateQRSlug(name: string): string {
  const timestamp = Date.now().toString(36).slice(-4);
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // เอาเฉพาะ a-z, 0-9, space, dash
    .replace(/\s+/g, '-')           // แทนที่ space ด้วย dash
    .slice(0, 30);                  // จำกัดความยาว
    
  return `${normalized}-${timestamp}`;
}

/**
 * ตรวจสอบความถูกต้องของ slug
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9_-]+$/.test(slug);
}

/**
 * สร้าง QR Code พร้อมดาวน์โหลด
 */
export function downloadQRCode(
  dataUrl: string,
  filename: string = 'qr-code.png'
): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * สร้าง QR Code แบบมี Logo ตรงกลาง (ใช้ canvas)
 * Note: ต้องใช้ใน client-side เท่านั้น
 */
export async function generateQRWithLogo(
  text: string,
  logoUrl?: string,
  options?: {
    width?: number;
    logoSize?: number;
    bgColor?: string;
  }
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('generateQRWithLogo ใช้ได้เฉพาะ client-side');
  }

  const { width = 400, logoSize = 80, bgColor = '#FFFFFF' } = options || {};
  
  // สร้าง QR Code ปกติ
  const qrDataUrl = await generateQRCodeDataURL(text, {
    width,
    margin: 2,
    color: {
      dark: '#000000',
      light: bgColor
    }
  });

  if (!logoUrl) {
    return qrDataUrl;
  }

  // สร้าง canvas เพื่อวาด QR + Logo
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  canvas.width = width;
  canvas.height = width;

  // วาด QR Code
  const qrImage = new Image();
  qrImage.crossOrigin = 'anonymous';
  
  return new Promise((resolve, reject) => {
    qrImage.onload = () => {
      ctx.drawImage(qrImage, 0, 0, width, width);

      // วาด Logo ตรงกลาง
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const x = (width - logoSize) / 2;
        const y = (width - logoSize) / 2;
        
        // วาดพื้นหลังสีขาวให้ logo
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
        
        ctx.drawImage(logo, x, y, logoSize, logoSize);
        resolve(canvas.toDataURL('image/png'));
      };
      logo.onerror = reject;
      logo.src = logoUrl;
    };
    qrImage.onerror = reject;
    qrImage.src = qrDataUrl;
  });
}

/**
 * คำนวณขนาด QR Code ที่เหมาะสมสำหรับการพิมพ์
 */
export function getQRPrintSize(pixelWidth: number, dpi: number = 300): number {
  // แปลง pixel เป็น mm (1 inch = 25.4 mm)
  return (pixelWidth / dpi) * 25.4;
}

/**
 * สร้าง batch QR Codes สำหรับหลายตำแหน่ง
 */
export async function generateBatchQRCodes(
  baseUrl: string,
  formSlug: string,
  locations: Array<{ name: string; content?: string }>
): Promise<Array<{ name: string; qrSlug: string; dataUrl: string }>> {
  const results = [];
  
  for (const location of locations) {
    const qrSlug = generateQRSlug(location.name);
    const url = buildQRRedirectURL(baseUrl, qrSlug);
    const dataUrl = await generateQRCodeDataURL(url);
    
    results.push({
      name: location.name,
      qrSlug,
      dataUrl
    });
  }
  
  return results;
}
