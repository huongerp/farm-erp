/**
 * Tự sinh mã Barcode cho tài sản (dạng CODE128).
 * Ưu tiên: ma_tai_san nếu có, không thì TS + timestamp + random ngắn.
 */
export function generateAssetBarcode(ma_tai_san?: string | null, existingId?: string | null): string {
  if (ma_tai_san && ma_tai_san.trim()) {
    const clean = ma_tai_san.replace(/\s/g, '').replace(/-/g, '');
    if (clean.length >= 4) return clean.slice(0, 24);
    return `TS${clean}${Date.now().toString(36).slice(-6)}`;
  }
  const suffix = existingId
    ? String(existingId).replace(/\D/g, '').slice(-8) || Date.now().toString(36).slice(-6)
    : Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 6);
  return `TS${suffix}`;
}
