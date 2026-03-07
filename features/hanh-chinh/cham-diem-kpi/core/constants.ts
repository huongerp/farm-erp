import type { DanhGiaKpi, KpiLoaiChiSo } from './types';

/** Ngưỡng điểm để đánh giá Đạt (>= 85) */
export const NGUONG_DAT_KPI = 85;

export const getDanhGiaKpiLabel = (danhGia: DanhGiaKpi, t: (key: string) => string) =>
  danhGia === 'dat' ? t('chamDiemKpi.danhGia.dat') : t('chamDiemKpi.danhGia.khongDat');

export const getDanhGiaKpiFromTong = (tongKpi: number): DanhGiaKpi =>
  tongKpi >= NGUONG_DAT_KPI ? 'dat' : 'khong_dat';

/** Tính tỷ lệ % và điểm từ mục tiêu & thực đạt theo loại xuôi/ngược */
export function computeTyLeAndDiem(
  loai: KpiLoaiChiSo | undefined,
  muc_tieu: number | undefined,
  thuc_dat: number | undefined
): { ty_le: number; diem: number } {
  if (muc_tieu == null || thuc_dat == null || Number.isNaN(muc_tieu) || Number.isNaN(thuc_dat)) {
    return { ty_le: 0, diem: 0 };
  }
  if (muc_tieu === 0) return { ty_le: 0, diem: 0 };
  let ty_le: number;
  if (loai === 'nguoc') {
    // Ngược: càng thấp càng tốt (vd: số lỗi). ty_le = (muc_tieu - thuc_dat) / muc_tieu * 100
    ty_le = Math.max(0, ((muc_tieu - thuc_dat) / muc_tieu) * 100);
  } else {
    // Xuôi (mặc định): càng cao càng tốt. ty_le = thuc_dat / muc_tieu * 100, tối đa 100
    ty_le = Math.min(100, (thuc_dat / muc_tieu) * 100);
  }
  const diem = Math.round(Math.min(100, Math.max(0, ty_le)) * 10) / 10;
  return { ty_le: Math.round(ty_le * 10) / 10, diem };
}

export const getKpiLoaiLabel = (loai: KpiLoaiChiSo | undefined, t: (key: string) => string) =>
  loai === 'nguoc' ? t('chamDiemKpi.loaiChiSo.nguoc') : t('chamDiemKpi.loaiChiSo.xuoi');
