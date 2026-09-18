/**
 * Phạm vi xem sổ quỹ theo chi nhánh — thuần, không React (test cạnh file).
 *
 * Bảng quỹ có cột `id_chi_nhanh` trực tiếp nên KHÔNG cần đi vòng qua kho như
 * lib/branch-scope-query.ts. Fail-closed: không có chi nhánh nào được phân thì
 * truy vấn phải trả rỗng, tuyệt đối không bỏ filter.
 */

/** Id không bao giờ tồn tại — dùng để ép truy vấn trả rỗng (giống phieu-kho service). */
export const IMPOSSIBLE_NUM_ID = -2147483647;

export interface QuyBranchScope {
  viewAll: boolean;
  allowedBranchIds: string[];
}

/**
 * Danh sách id chi nhánh (số) được phép đọc.
 * - `viewAll` → `null` nghĩa là không lọc theo chi nhánh.
 * - Không có chi nhánh hợp lệ → `[IMPOSSIBLE_NUM_ID]` (rỗng an toàn).
 */
export function resolveAllowedChiNhanhIds(scope: QuyBranchScope): number[] | null {
  if (scope.viewAll) return null;
  const ids = [
    ...new Set(
      scope.allowedBranchIds
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n) && !Number.isNaN(n))
    ),
  ].sort((a, b) => a - b);
  return ids.length > 0 ? ids : [IMPOSSIBLE_NUM_ID];
}

/** Người dùng có được thao tác trên quỹ của chi nhánh này không (theo phạm vi xem). */
export function canAccessChiNhanh(scope: QuyBranchScope, idChiNhanh: string | null | undefined): boolean {
  if (scope.viewAll) return true;
  if (!idChiNhanh) return false;
  return scope.allowedBranchIds.includes(String(idChiNhanh));
}

/** Lọc danh sách đã tải ở client theo phạm vi (dùng cho tập nhỏ: section, tra cứu). */
export function filterByChiNhanhScope<T extends { id_chi_nhanh: string }>(
  rows: T[],
  scope: QuyBranchScope
): T[] {
  if (scope.viewAll) return rows;
  if (scope.allowedBranchIds.length === 0) return [];
  const allowed = new Set(scope.allowedBranchIds.map(String));
  return rows.filter((r) => allowed.has(String(r.id_chi_nhanh)));
}
