/**
 * Loại phiếu: Cấp phát, Thu hồi, Luân chuyển vị trí, Luân chuyển người quản lý, Luân chuyển cả 2.
 */
export type LoaiPhieu =
  | 'cap_phat'
  | 'thu_hoi'
  | 'luan_chuyen_vi_tri'
  | 'luan_chuyen_nguoi'
  | 'luan_chuyen_ca_hai';

/** Dòng chi tiết – 1 tài sản trong phiếu */
export interface PhieuCapPhatThuHoiChiTiet {
  id: string;
  id_phieu: string;
  id_tai_san: string;
  ma_tai_san?: string;
  ten_tai_san?: string;
  id_noi_luu_truoc?: string | null;
  ten_noi_luu_truoc?: string | null;
  id_noi_luu_sau?: string | null;
  ten_noi_luu_sau?: string | null;
  ghi_chu?: string | null;
  tg_tao?: string;
  tg_cap_nhat?: string;
}

/** Phiếu cấp phát / thu hồi / luân chuyển – header (master) */
export interface PhieuCapPhatThuHoi {
  id: string;
  ma_phieu: string;
  loai_phieu: LoaiPhieu;
  /** Người giữ trước (null = kho) */
  id_nguoi_giu_truoc?: string | null;
  ten_nguoi_giu_truoc?: string | null;
  ma_nguoi_giu_truoc?: string | null;
  /** Người giữ sau */
  id_nguoi_giu_sau?: string | null;
  ten_nguoi_giu_sau?: string | null;
  ma_nguoi_giu_sau?: string | null;
  ngay_thuc_hien: string;
  id_nguoi_thuc_hien: string;
  ten_nguoi_thuc_hien?: string | null;
  id_nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
  ghi_chu?: string | null;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Chi tiết (populated khi getById) */
  chi_tiet?: PhieuCapPhatThuHoiChiTiet[];
}

/** Dòng chi tiết khi tạo/sửa phiếu */
export interface PhieuCapPhatThuHoiChiTietCreate {
  id_tai_san: string;
  id_noi_luu_sau: string;
  ghi_chu?: string | null;
}

/** Payload tạo phiếu – header + chi tiết */
export interface PhieuCapPhatThuHoiCreate {
  loai_phieu: LoaiPhieu;
  id_nguoi_giu_truoc?: string | null;
  id_nguoi_giu_sau?: string | null;
  ngay_thuc_hien: string;
  id_nguoi_thuc_hien: string;
  ghi_chu?: string | null;
  chi_tiet: PhieuCapPhatThuHoiChiTietCreate[];
}

/** Dòng chi tiết enriched với thông tin header – dùng cho TaiSanDetail history */
export interface PhieuChiTietWithHeader extends PhieuCapPhatThuHoiChiTiet {
  ma_phieu: string;
  loai_phieu: LoaiPhieu;
  ngay_thuc_hien: string;
  ten_nguoi_giu_sau?: string | null;
  ten_nguoi_thuc_hien?: string | null;
}

/** Dòng chi tiết flat (kèm header) – dùng cho tab "Chi tiết" tổng hợp */
export interface PhieuChiTietRow extends PhieuCapPhatThuHoiChiTiet {
  ma_phieu: string;
  loai_phieu: LoaiPhieu;
  ngay_thuc_hien: string;
  ten_nguoi_giu_truoc?: string | null;
  ten_nguoi_giu_sau?: string | null;
  ten_nguoi_thuc_hien?: string | null;
}
