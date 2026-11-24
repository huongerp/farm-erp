/**
 * Tồn đầu ngày theo phiếu liền trước (RPC `fn_bcsc_ton_dau_ngay`, migration 100).
 * `co_phieu_truoc` = có phiếu trước cùng chi nhánh (từ mốc 02/11/2026) → ô tồn đầu khoá, DB trigger ghi đè;
 * false → phiếu đầu tiên, nhập tay.
 */
export interface BcscTonDauNgay {
  co_phieu_truoc: boolean;
  ton_dau: number;
  /** yyyy-mm-dd của phiếu liền trước, null khi không có. */
  ngay_truoc: string | null;
}

/** RPC trả TABLE → PostgREST trả mảng 1 dòng; numeric có thể về dạng chuỗi. Rác → không có phiếu trước. */
export function docBcscTonDauNgay(data: unknown): BcscTonDauNgay {
  const dong = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null | undefined;
  const n = Number(dong?.ton_dau);
  const ngay = typeof dong?.ngay_truoc === 'string' && dong.ngay_truoc ? dong.ngay_truoc.slice(0, 10) : null;
  const co = dong?.co_phieu_truoc === true && ngay != null && Number.isFinite(n);
  return { co_phieu_truoc: co, ton_dau: co ? n : 0, ngay_truoc: co ? ngay : null };
}
