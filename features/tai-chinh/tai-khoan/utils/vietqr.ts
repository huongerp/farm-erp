/**
 * Sinh mã VietQR (NAPAS) để chuyển khoản ngân hàng VN.
 * Dùng chuẩn NAPAS, không cần cấu hình API – sinh nội dung QR và vẽ ảnh hoàn toàn ở client.
 * Tham khảo: https://vietqr.net/, thư viện napas-qr + qrcode.
 */

import napasQR from 'napas-qr';
import QRCode from 'qrcode';

export interface VietQROptions {
  ma_ngan_hang: string;
  so_tai_khoan: string;
  chu_tai_khoan: string;
  amount?: number;
  memo?: string;
}

/** Map mã ngân hàng ngắn (VCB, TCB...) sang BIN 6 chữ số cho NAPAS. */
const SHORT_CODE_TO_BIN: Record<string, string> = {
  VCB: '970436',
  TCB: '970407',
  BIDV: '970418',
  MB: '970422',
  ACB: '970416',
  VPBank: '970432',
  VTB: '970415',
  VietinBank: '970415',
  HDBank: '970437',
  TPBank: '970423',
  MSB: '970426',
  VIB: '970441',
  OCB: '970448',
  SHB: '970443',
};

function toBIN(ma: string): string {
  const trimmed = ma?.trim() ?? '';
  if (/^\d{6}$/.test(trimmed)) return trimmed;
  return SHORT_CODE_TO_BIN[trimmed.toUpperCase()] ?? trimmed;
}

/**
 * Sinh mã QR dạng data URL (base64) theo chuẩn NAPAS – không cần API key.
 * Trả về null nếu thiếu dữ liệu hoặc lỗi.
 */
export async function genVietQRBase64(options: VietQROptions): Promise<string | null> {
  const { ma_ngan_hang, so_tai_khoan, chu_tai_khoan, amount, memo } = options;
  const bin = toBIN(ma_ngan_hang ?? '');
  const account = so_tai_khoan?.trim();
  if (!bin || !account) return null;

  try {
    const napasExport = (napasQR as { default?: { generateQRContent?: (o: unknown) => string }; generateQRContent?: (o: unknown) => string }).default ?? napasQR;
    const generateQRContent = (napasExport as { generateQRContent?: (opts: unknown) => string }).generateQRContent;
    if (typeof generateQRContent !== 'function') return null;

    const description = [chu_tai_khoan?.trim(), memo?.trim()].filter(Boolean).join(' - ') || 'Chuyen khoan';
    const qrProps: Record<string, unknown> = {
      qrType: 'STATIC',
      bin,
      receiverNumber: account,
      orderId: '0',
      description: description.slice(0, 99) || ' ',
    };
    if (amount != null && amount > 0) {
      qrProps.qrType = 'DYNAMIC';
      qrProps.amount = amount;
    }

    const qrContent = generateQRContent(qrProps);
    if (!qrContent || typeof qrContent !== 'string') return null;

    const qrExport = (QRCode as { default?: { toDataURL?: (t: string, o?: object) => Promise<string> }; toDataURL?: (t: string, o?: object) => Promise<string> }).default ?? QRCode;
    const toDataURL = (qrExport as { toDataURL?: (text: string, opts?: object) => Promise<string> }).toDataURL;
    if (typeof toDataURL !== 'function') return null;

    const dataUrl = await toDataURL(qrContent, {
      errorCorrectionLevel: 'M',
      margin: 2,
      type: 'image/png',
    });
    return dataUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Luôn true – QR sinh local theo NAPAS, không phụ thuộc API.
 */
export function isVietQRConfigured(): boolean {
  return true;
}
