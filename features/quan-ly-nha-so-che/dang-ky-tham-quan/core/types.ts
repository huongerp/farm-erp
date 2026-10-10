/** Đăng ký tham quan farm — DB: fp_farm_dang_ky_tham_quan (+ _khach). Trạng thái dùng chung luồng với ĐKNH. */
import type { TrangThaiDkNh } from '../../dang-ky-nhan-hang/core/types';

export type TrangThaiDkTq = TrangThaiDkNh;
export { TRANG_THAI_DKNH as TRANG_THAI_DKTQ } from '../../dang-ky-nhan-hang/core/types';

export const MUC_DICH_THAM_QUAN = ['trai_nghiem_nong_nghiep', 'tham_quan_du_lich', 'tham_quan_nsc', 'khac'] as const;
export type MucDichThamQuan = (typeof MUC_DICH_THAM_QUAN)[number];

export const PHUONG_TIEN = ['xe_rieng', 'xe_cong_ty', 'xe_don_nsc'] as const;
export type PhuongTien = (typeof PHUONG_TIEN)[number];

export const GIOI_TINH = ['nam', 'nu', 'khac'] as const;
export type GioiTinh = (typeof GIOI_TINH)[number];

export interface KhachThamQuan {
  stt: number;
  ho_ten: string;
  gioi_tinh: GioiTinh | null;
  quoc_tich: string | null;
  so_dien_thoai: string | null;
  nguoi_gioi_thieu: string | null;
  khu_vuc_tham_quan: string | null;
  don_vi_lam_viec: string | null;
}

export interface DangKyThamQuan {
  id: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  /** YYYY-MM-DD */
  ngay_dang_ky: string;
  /** ISO timestamptz — đăng ký từ */
  tg_bat_dau: string;
  /** ISO timestamptz — đăng ký đến */
  tg_ket_thuc: string | null;
  muc_dich: MucDichThamQuan[];
  muc_dich_khac: string | null;
  phuong_tien: PhuongTien | null;
  nguoi_dai_dien: string | null;
  id_nguoi_tiep_don: string | null;
  ten_nguoi_tiep_don: string | null;
  tg_vao_thuc_te: string | null;
  tg_ra_thuc_te: string | null;
  id_nguoi_check_in: string | null;
  id_nguoi_check_out: string | null;
  ten_nguoi_check_in: string | null;
  ten_nguoi_check_out: string | null;
  trang_thai: TrangThaiDkTq;
  ghi_chu: string | null;
  hinh_anh_urls: string[];
  id_nguoi_tao: string | null;
  ten_nguoi_tao: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  khach: KhachThamQuan[];
}
