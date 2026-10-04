import { useMemo } from 'react';
import type { AdminFormTomTat } from '../core/types';
import type { AdminFormListFilters } from '../store/useAdminFormListStore';
import { phieuChamKy, type KyLoc } from '../core/ky-loc';

export interface NguoiGuiOption {
  id: string;
  ten: string;
}

/**
 * Đếm số phiếu theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 * Chạy trên bản TomTat của toàn bộ phạm vi xem — không phải trang đang xem.
 */
export function useAdminFormFilterCounts(
  items: AdminFormTomTat[],
  filters: AdminFormListFilters,
  /** Kỳ của chip Thời gian (đã tính sẵn), null = mọi lúc. */
  ky: KyLoc | null
) {
  return useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const nguoiTaoCounts: Record<string, number> = {};
    const nguoiGui = new Map<string, string>();

    const nguoiTao = filters.nguoiTao ?? [];
    const matchStatus = (f: AdminFormTomTat) => filters.status.length === 0 || filters.status.includes(f.trang_thai);
    const matchType = (f: AdminFormTomTat) => filters.type.length === 0 || filters.type.includes(f.loai_phieu);
    const matchNguoi = (f: AdminFormTomTat) => nguoiTao.length === 0 || nguoiTao.includes(f.nguoi_tao_id);
    // Cùng điều kiện "chạm vào kỳ" như lọc ở server.
    const matchMonth = (f: AdminFormTomTat) => phieuChamKy(f, ky);

    for (const f of items) {
      if (f.nguoi_tao_id && !nguoiGui.has(f.nguoi_tao_id)) nguoiGui.set(f.nguoi_tao_id, f.ten_nguoi_tao);
      const passStatus = matchStatus(f);
      const passType = matchType(f);
      const passNguoi = matchNguoi(f);
      const passMonth = matchMonth(f);

      if (passType && passNguoi && passMonth) {
        statusCounts[f.trang_thai] = (statusCounts[f.trang_thai] || 0) + 1;
      }
      if (passStatus && passNguoi && passMonth) {
        typeCounts[f.loai_phieu] = (typeCounts[f.loai_phieu] || 0) + 1;
      }
      if (passStatus && passType && passMonth && f.nguoi_tao_id) {
        nguoiTaoCounts[f.nguoi_tao_id] = (nguoiTaoCounts[f.nguoi_tao_id] || 0) + 1;
      }
    }

    const nguoiGuiOptions: NguoiGuiOption[] = Array.from(nguoiGui, ([id, ten]) => ({ id, ten }));
    return { statusCounts, typeCounts, nguoiTaoCounts, nguoiGuiOptions };
  }, [items, filters, ky]);
}
