import { useCallback, useMemo } from 'react';
import { TRANG_THAI } from '../../../../lib/constants';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { DgdvPhamViTong } from '../services/danh-gia-dau-vao-tong-ngay.service';
import { useDgdvViewScope } from './use-danh-gia-dau-vao-permissions';

/**
 * Chi nhánh cho các tab tổng hợp: danh sách đang dùng trong phạm vi xem + tên theo id (gồm cả chi nhánh
 * đã ngưng, để số cũ vẫn có tên) + phạm vi truy vấn view tổng (`idChiNhanh` null = mọi chi nhánh được xem).
 */
export function useDgdvChiNhanhXem(idChiNhanh: string | null) {
  const viewScope = useDgdvViewScope();
  const { data: branches = [] } = useBranches();

  const dsChiNhanh = useMemo(() => {
    const dangDung = branches.filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG);
    if (viewScope.viewAll) return dangDung;
    const cho = new Set(viewScope.allowedBranchIds);
    return dangDung.filter((b) => cho.has(String(b.id)));
  }, [branches, viewScope.viewAll, viewScope.allowedBranchIds]);

  const tenTheoId = useMemo(() => new Map(branches.map((b) => [String(b.id), b.ten_chi_nhanh])), [branches]);
  const tenCn = useCallback((id: string) => tenTheoId.get(id) ?? `#${id}`, [tenTheoId]);

  const phamVi: DgdvPhamViTong = useMemo(
    () => ({ idChiNhanh, viewAll: viewScope.viewAll, allowedBranchIds: viewScope.allowedBranchIds }),
    [idChiNhanh, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  /** Thứ tự chi nhánh khi gom: chi nhánh đang chọn, hoặc mọi chi nhánh trong phạm vi. */
  const thuTuCn = useMemo(() => (idChiNhanh ? [idChiNhanh] : dsChiNhanh.map((b) => String(b.id))), [idChiNhanh, dsChiNhanh]);

  return { dsChiNhanh, tenCn, phamVi, thuTuCn, dangTaiPhamVi: viewScope.isLoading };
}
