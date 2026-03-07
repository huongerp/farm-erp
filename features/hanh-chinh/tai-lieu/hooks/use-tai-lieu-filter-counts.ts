import { useMemo } from 'react';
import type { TaiLieu } from '../core/types';
import type { TaiLieuFilters } from '../store/useTaiLieuStore';

/**
 * Đếm số tài liệu theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 */
export function useTaiLieuFilterCounts(items: TaiLieu[], filters: TaiLieuFilters) {
  return useMemo(() => {
    const huongCounts: Record<string, number> = {};
    const phongBanCounts: Record<string, number> = {};
    const loaiCounts: Record<string, number> = {};
    const trangThaiCounts: Record<string, number> = {};

    const idLoaiArr = Array.isArray(filters.id_loai) ? filters.id_loai : filters.id_loai ? [filters.id_loai] : [];
    const matchHuong = (t: TaiLieu) => !filters.huong || t.huong === filters.huong;
    const matchPhongBan = (t: TaiLieu) => !filters.id_phong_ban || t.id_phong_ban === filters.id_phong_ban;
    const matchLoai = (t: TaiLieu) => idLoaiArr.length === 0 || idLoaiArr.includes(t.id_loai);
    const matchTrangThai = (t: TaiLieu) => !filters.id_trang_thai || t.id_trang_thai === filters.id_trang_thai;

    for (const t of items) {
      const passHuong = matchHuong(t);
      const passPhongBan = matchPhongBan(t);
      const passLoai = matchLoai(t);
      const passTrangThai = matchTrangThai(t);

      if (passPhongBan && passLoai && passTrangThai && t.huong) {
        huongCounts[t.huong] = (huongCounts[t.huong] || 0) + 1;
      }
      if (passHuong && passLoai && passTrangThai && t.id_phong_ban) {
        phongBanCounts[t.id_phong_ban] = (phongBanCounts[t.id_phong_ban] || 0) + 1;
      }
      if (passHuong && passPhongBan && passTrangThai && t.id_loai) {
        loaiCounts[t.id_loai] = (loaiCounts[t.id_loai] || 0) + 1;
      }
      if (passHuong && passPhongBan && passLoai && t.id_trang_thai) {
        trangThaiCounts[t.id_trang_thai] = (trangThaiCounts[t.id_trang_thai] || 0) + 1;
      }
    }

    return { huongCounts, phongBanCounts, loaiCounts, trangThaiCounts };
  }, [items, filters]);
}
