/**
 * Cấp bậc cao nhất (fp_var_nhan_vien.cap_bac = 1) được toàn quyền mọi module,
 * không phụ thuộc fp_var_phan_quyen.
 */

export const CAP_BAC_TOAN_QUYEN = 1;

/**
 * true khi cấp bậc nhân viên đúng bằng 1.
 * null/undefined/rỗng/không phải số → false (không được hiểu nhầm là cấp bậc 1).
 */
export function laCapBacToanQuyen(capBac: unknown): boolean {
  if (capBac == null) return false;
  if (typeof capBac === 'string' && capBac.trim() === '') return false;
  const so = Number(capBac);
  return Number.isFinite(so) && so === CAP_BAC_TOAN_QUYEN;
}
