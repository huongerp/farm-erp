import type { TrangThaiHoatDong } from '../../../../lib/constants';

/** Nơi lưu tài sản - liên kết với Chi nhánh */
export interface AssetStorageLocation {
  id: string;
  id_chi_nhanh: string;
  ten_chi_nhanh?: string;
  ma_noi_luu: string;
  ten_noi_luu: string;
  ghi_chu?: string;
  trang_thai: TrangThaiHoatDong;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface AssetStorageLocationFormState {
  id_chi_nhanh: string;
  ma_noi_luu: string;
  ten_noi_luu: string;
  ghi_chu?: string;
  trang_thai: TrangThaiHoatDong;
}

/** Trạng thái tài sản */
export interface AssetStatus {
  id: string;
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: TrangThaiHoatDong;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface AssetStatusFormState {
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: TrangThaiHoatDong;
}

/** Phương pháp khấu hao */
export type PhuongPhapKhauHao = 'duong_thang' | 'so_du_giam_dan';

/** Nhóm tài sản chuyên nghiệp */
export interface AssetGroup {
  id: string;
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: TrangThaiHoatDong;
  /** Phương pháp khấu hao (đường thẳng / số dư giảm dần) */
  phuong_phap_khau_hao: PhuongPhapKhauHao;
  /** Tỷ lệ khấu hao %/năm (dùng cho cả hai phương pháp) */
  ty_le_khau_hao?: number | null;
  /** Số năm sử dụng (đường thẳng: nguyên_giá / so_nam_su_dung) */
  so_nam_su_dung?: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface AssetGroupFormState {
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: TrangThaiHoatDong;
  phuong_phap_khau_hao: PhuongPhapKhauHao;
  ty_le_khau_hao?: number | null;
  so_nam_su_dung?: number | null;
}
