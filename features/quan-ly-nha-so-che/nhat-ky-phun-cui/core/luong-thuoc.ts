/** Lượng thuốc của một lần pha = nồng độ (ml hoặc g trên lít nước) × lượng nước (lít). */
export function tinhLuongThuoc(nongDo: number | null, luongNuocLit: number | null): number {
  if (!nongDo || !luongNuocLit) return 0;
  if (!Number.isFinite(nongDo) || !Number.isFinite(luongNuocLit)) return 0;
  const v = Math.round(nongDo * luongNuocLit * 1000) / 1000;
  return v === 0 ? 0 : v; // tránh -0
}
