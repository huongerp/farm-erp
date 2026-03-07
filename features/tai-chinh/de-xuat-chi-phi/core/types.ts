/**
 * Types cho module Đề xuất chi phí.
 * Liên kết với Danh mục tài chính (id_danh_muc) và Tài khoản (id_tai_khoan).
 */

/** Dòng chi tiết đề xuất: một danh mục tài chính + số tiền + nội dung. */
export interface DeXuatChiPhiChiTiet {
  id: string;
  id_de_xuat_chi_phi: string;
  id_danh_muc: string;
  ten_danh_muc: string;
  so_tien: number;
  noi_dung?: string;
}

export interface DeXuatChiPhi {
  id: string;
  so_phieu: string;
  ngay: string;
  loai: 'thu' | 'chi';
  id_tai_khoan: string | null;
  ten_tai_khoan?: string | null;
  id_nguoi_de_xuat: string;
  ten_nguoi_de_xuat: string;
  ma_nguoi_de_xuat?: string;
  /** 0 = Chờ duyệt, 1 = Đã duyệt, 2 = Từ chối */
  trang_thai: 0 | 1 | 2;
  id_nguoi_duyet?: string | null;
  ten_nguoi_duyet?: string | null;
  ngay_duyet?: string | null;
  ghi_chu_duyet?: string | null;
  ly_do_tu_choi?: string | null;
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_tiet?: DeXuatChiPhiChiTiet[];
}
