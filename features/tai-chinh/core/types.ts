/**
 * Types dùng chung cho module Tài chính (Tài khoản, Danh mục, Thu chi).
 */

export interface TaiKhoan {
  id: string;
  ten_tai_khoan: string;
  so_tai_khoan: string;
  ngan_hang: string;
  ma_ngan_hang?: string;
  chu_tai_khoan?: string;
  loai_tai_khoan: string;
  so_du_dau: number;
  tong_thu: number;
  tong_chi: number;
  so_du_cuoi: number;
  so_du_hien_tai: number;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Hạng mục tài chính: 2 cấp (cha id_cha null, con id_cha = id cha). */
export interface HangMucTaiChinh {
  id: string;
  ma_danh_muc: string;
  ten_danh_muc: string;
  loai: 'thu' | 'chi';
  id_cha: string | null;
  thu_tu: number;
  mo_ta?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Alias cho mock / code dùng tên DanhMucTaiChinh. */
export type DanhMucTaiChinh = HangMucTaiChinh;

/** Phân quyền theo hạng mục con: quản lý hoặc đề xuất, gán theo chức vụ. */
export interface HangMucQuyen {
  id: string;
  id_hang_muc: string;
  id_chuc_vu: string;
  loai_quyen: 'quan_ly' | 'de_xuat';
  ten_chuc_vu?: string;
  ten_phong_ban?: string;
}

/** Loại giao dịch thu chi: thu, chi, chuyển quỹ. */
export type ThuChiLoai = 'thu' | 'chi' | 'chuyen_quy';

export interface ThuChi {
  id: string;
  ma_giao_dich: string;
  ngay_giao_dich: string;
  so_tien: number;
  loai: ThuChiLoai;
  id_tai_khoan: string;
  ten_tai_khoan: string;
  /** Thu/chi: danh mục; chuyển quỹ: có thể để trống. */
  id_danh_muc?: string;
  ten_danh_muc?: string;
  noi_dung: string;
  id_nhan_vien_thuc_hien?: string;
  ten_nhan_vien?: string;
  trang_thai: string;
  /** Chỉ khi loai = chuyen_quy: tài khoản đích. */
  id_tai_khoan_dich?: string;
  ten_tai_khoan_dich?: string;
  /** Phí giao dịch (chuyển quỹ, v.v.). */
  phi_giao_dich?: number;
  /** Liên kết đề xuất chi phí (nếu giao dịch từ đề xuất). */
  id_de_xuat_chi_phi?: string;
  so_phieu_de_xuat?: string;
  tg_tao?: string;
  tg_cap_nhat?: string;
}
