/** Màu tiêu đề cột dây: nền theo mã màu (dây 2 màu chia đôi), chữ đen / trắng tương phản. */
import type { CSSProperties } from 'react';

const HEX_RE = /^#([0-9a-f]{6})$/i;

/** Độ sáng tương đối (WCAG) của #RRGGBB, 0 = đen … 1 = trắng; mã sai → null. */
export function doSangTuongDoi(hex: string | null | undefined): number | null {
  const m = HEX_RE.exec(hex ?? '');
  if (!m) return null;
  const kenh = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * kenh[0] + 0.7152 * kenh[1] + 0.0722 * kenh[2];
}

/**
 * Màu chữ đọc rõ trên nền (dây 2 màu: lấy trung bình độ sáng hai nửa). Ngưỡng 0,179 là điểm
 * tương phản bằng nhau giữa chữ đen và chữ trắng.
 */
export function mauChuTuongPhan(mau1: string | null, mau2?: string | null): '#000000' | '#FFFFFF' {
  const ds = [doSangTuongDoi(mau1), doSangTuongDoi(mau2)].filter((x): x is number => x != null);
  if (ds.length === 0) return '#000000';
  const tb = ds.reduce((a, b) => a + b, 0) / ds.length;
  return tb > 0.179 ? '#000000' : '#FFFFFF';
}

/** Style nền + chữ cho ô tiêu đề cột dây. Chưa biết màu → không tô. */
export function styleTieuDeCot(mau1: string | null, mau2: string | null): CSSProperties | undefined {
  if (!mau1) return undefined;
  const nen = mau2 ? `linear-gradient(to right, ${mau1} 50%, ${mau2} 50%)` : mau1;
  const chu = mauChuTuongPhan(mau1, mau2);
  return {
    background: nen,
    color: chu,
    // Dây 2 màu tương phản ngược nhau: viền chữ mảnh giữ chữ đọc được trên cả hai nửa.
    textShadow: mau2 ? `0 0 2px ${chu === '#000000' ? '#FFFFFF' : '#000000'}` : undefined,
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact',
  };
}
