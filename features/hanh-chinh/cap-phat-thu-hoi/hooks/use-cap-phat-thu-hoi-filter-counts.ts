import { useMemo } from 'react';
import type { PhieuCapPhatThuHoi } from '../core/types';
import type { CapPhatThuHoiFilters } from '../store/useCapPhatThuHoiStore';

/**
 * Đếm số phiếu theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 * list = danh sách phiếu người dùng được xem (sau phân quyền, đã lọc search nếu API hỗ trợ).
 */
export function useCapPhatThuHoiFilterCounts(
  list: PhieuCapPhatThuHoi[],
  filters: CapPhatThuHoiFilters,
) {
  return useMemo(() => {
    const loaiCounts: Record<string, number> = {};
    const noiLuuCounts: Record<string, number> = {};
    const nguoiThucHienCounts: Record<string, number> = {};

    const matchLoai = (p: PhieuCapPhatThuHoi) =>
      filters.loai_phieu.length === 0 || filters.loai_phieu.includes(p.loai_phieu);
    const matchDateFrom = (p: PhieuCapPhatThuHoi) =>
      !filters.dateFrom || p.ngay_thuc_hien >= filters.dateFrom;
    const matchDateTo = (p: PhieuCapPhatThuHoi) =>
      !filters.dateTo || p.ngay_thuc_hien <= filters.dateTo;
    const matchNoiLuu = (p: PhieuCapPhatThuHoi) =>
      filters.id_noi_luu_truoc.length === 0 || filters.id_noi_luu_truoc.includes(p.id_noi_luu_truoc);
    const matchNguoiThucHien = (p: PhieuCapPhatThuHoi) =>
      filters.id_nguoi_thuc_hien.length === 0 ||
      filters.id_nguoi_thuc_hien.includes(p.id_nguoi_thuc_hien);

    for (const p of list) {
      const passLoai = matchLoai(p);
      const passDate = matchDateFrom(p) && matchDateTo(p);
      const passNoiLuu = matchNoiLuu(p);
      const passNguoi = matchNguoiThucHien(p);

      if (passDate && passNoiLuu && passNguoi) {
        loaiCounts[p.loai_phieu] = (loaiCounts[p.loai_phieu] || 0) + 1;
      }
      if (passLoai && passDate && passNguoi) {
        noiLuuCounts[p.id_noi_luu_truoc] = (noiLuuCounts[p.id_noi_luu_truoc] || 0) + 1;
      }
      if (passLoai && passDate && passNoiLuu) {
        nguoiThucHienCounts[p.id_nguoi_thuc_hien] =
          (nguoiThucHienCounts[p.id_nguoi_thuc_hien] || 0) + 1;
      }
    }

    return { loaiCounts, noiLuuCounts, nguoiThucHienCounts };
  }, [list, filters]);
}
