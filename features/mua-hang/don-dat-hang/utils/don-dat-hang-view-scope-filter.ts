/**
 * Phạm vi xem đơn đặt hàng phía client — cùng luật với applyDonDatHangScope (lọc ở PostgREST):
 * xem hết (cấp bậc 1 / admin / all), hoặc đơn do chính mình đặt, hoặc kho nhận thuộc farm của mình.
 * Dùng cho các chỗ lấy đơn theo id (drawer, trang in) và ô lọc Kho nhận.
 */
import type { BranchListScope } from '../../../../lib/branch-scope-query';

type DonPhamVi = { id_kho_nhan?: string | null; id_nguoi_dat?: string | null };

export function donDatHangTrongPhamVi(don: DonPhamVi, scope: BranchListScope): boolean {
  if (scope.viewAll) return true;
  const own = scope.ownEmployeeIdNum;
  if (own != null && don.id_nguoi_dat != null && Number(don.id_nguoi_dat) === own) return true;
  if (!scope.viewByBranch) return false;
  if (don.id_kho_nhan == null || don.id_kho_nhan === '') return false;
  return scope.allowedKhoNumericIds.includes(Number(don.id_kho_nhan));
}

/** Kho hiện ở ô lọc "Kho nhận": người bị giới hạn chỉ thấy kho thuộc farm mình. */
export function locKhoTheoPhamVi<K extends { id: string }>(khoList: K[], scope: BranchListScope): K[] {
  if (scope.viewAll) return khoList;
  const allow = new Set(scope.viewByBranch ? scope.allowedKhoNumericIds : []);
  return khoList.filter((k) => allow.has(Number(k.id)));
}
