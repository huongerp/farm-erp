/** Nhật ký pha thuốc phun cùi — DB: fp_farm_ptc_nhat_ky (+ _lan), định mức fp_farm_ptc_dinh_muc. */
import type { DonViNongDo } from './constants';

export interface LanPha {
  /** id dòng ở DB (không dùng để ghi — sửa phiếu xoá và chèn lại toàn bộ dòng). */
  id: string;
  thu_tu: number;
  /** HH:mm hoặc null */
  gio: string | null;
  id_hang_hoa: string;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  dvt: string | null;
  nong_do: number | null;
  don_vi: DonViNongDo;
  luong_nuoc_lit: number | null;
  luong_thuoc: number | null;
  ghi_chu: string | null;
}

export interface NhatKyPhunCui {
  id: string;
  /** YYYY-MM-DD */
  ngay: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  id_nhan_vien_phu_trach: string | null;
  ten_nhan_vien_phu_trach: string | null;
  ghi_chu: string | null;
  id_nguoi_tao: string | null;
  ten_nguoi_tao: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  lan: LanPha[];
}

export interface DinhMucThuoc {
  id: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  id_hang_hoa: string;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  dvt: string | null;
  nong_do: number;
  don_vi: DonViNongDo;
  dang_dung: boolean;
  ghi_chu: string | null;
  thu_tu: number;
}

/** Một lần pha phẳng kèm vài cột của phiếu cha — tab Chi tiết. */
export interface NhatKyPhunCuiLanRow {
  id: string;
  id_nhat_ky: string;
  ngay: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  ten_nhan_vien_phu_trach: string | null;
  thu_tu: number;
  /** HH:mm */
  gio: string | null;
  id_hang_hoa: string | null;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  nong_do: number | null;
  don_vi: DonViNongDo;
  luong_nuoc_lit: number | null;
  luong_thuoc: number | null;
  ghi_chu: string | null;
}
