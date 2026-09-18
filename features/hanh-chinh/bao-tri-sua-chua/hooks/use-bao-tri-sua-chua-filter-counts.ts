import { useMemo } from 'react';
import type { PhieuBaoTriSuaChua } from '../core/types';
import type { BaoTriSuaChuaFilters } from '../store/useBaoTriSuaChuaStore';
import {
  getChiNhanhCuaPhieu,
  matchChiNhanh,
  matchHangMuc,
  matchNgay,
  matchNguoiTao,
  matchTaiSan,
  matchTrangThai,
  type TaiSanChiNhanhMap,
} from '../utils/filter-phieu-chi-phi';

/**
 * Đếm số phiếu theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 */
export function useBaoTriSuaChuaFilterCounts(
  list: PhieuBaoTriSuaChua[],
  filters: BaoTriSuaChuaFilters,
  branchMap: TaiSanChiNhanhMap = new Map(),
) {
  return useMemo(() => {
    const hangMucCounts: Record<string, number> = {};
    const taiSanCounts: Record<string, number> = {};
    const chiNhanhCounts: Record<string, number> = {};
    const trangThaiCounts: Record<string, number> = {};
    const nguoiTaoCounts: Record<string, number> = {};

    const bump = (acc: Record<string, number>, key: string) => {
      if (!key) return;
      acc[key] = (acc[key] || 0) + 1;
    };

    for (const p of list) {
      const passHangMuc = matchHangMuc(p, filters);
      const passDate = matchNgay(p, filters);
      const passTaiSan = matchTaiSan(p, filters);
      const passChiNhanh = matchChiNhanh(p, filters, branchMap);
      const passTrangThai = matchTrangThai(p, filters);
      const passNguoiTao = matchNguoiTao(p, filters);

      if (passDate && passTaiSan && passChiNhanh && passTrangThai && passNguoiTao) {
        bump(hangMucCounts, p.id_hang_muc);
      }
      if (passHangMuc && passDate && passChiNhanh && passTrangThai && passNguoiTao) {
        bump(taiSanCounts, p.id_tai_san);
      }
      if (passHangMuc && passDate && passTaiSan && passTrangThai && passNguoiTao) {
        bump(chiNhanhCounts, getChiNhanhCuaPhieu(p, branchMap));
      }
      if (passHangMuc && passDate && passTaiSan && passChiNhanh && passNguoiTao) {
        bump(trangThaiCounts, p.trang_thai);
      }
      if (passHangMuc && passDate && passTaiSan && passChiNhanh && passTrangThai) {
        bump(nguoiTaoCounts, String(p.id_nguoi_tao ?? ''));
      }
    }

    return { hangMucCounts, taiSanCounts, chiNhanhCounts, trangThaiCounts, nguoiTaoCounts };
  }, [list, filters, branchMap]);
}
