export type LoaiPhieuKho = 'nhap' | 'xuat' | 'chuyen';

/** Dòng chi tiết phiếu kho: một hàng hóa + số lượng. */
export interface PhieuKhoChiTiet {
  id: string;
  id_phieu_kho: string;
  id_hang_hoa: string;
  so_luong: number;
  don_vi_tinh?: string;
  ghi_chu?: string;
  /** Enrich từ danh sách hàng hóa */
  ma_hang?: string;
  ten_hang?: string;
}

export interface PhieuKho {
  id: string;
  so_phieu: string;
  ngay: string;
  loai: LoaiPhieuKho;
  id_kho: string;
  ten_kho?: string;
  id_kho_den?: string | null;
  ten_kho_den?: string;
  /** Nhà cung cấp (phiếu nhập). */
  id_nha_cung_cap?: string | null;
  ten_nha_cung_cap?: string;
  /** Khách hàng (phiếu xuất). */
  id_khach_hang?: string | null;
  ten_khach_hang?: string;
  /** 0 = Chờ duyệt, 1 = Đã duyệt, 2 = Không duyệt */
  trang_thai: 0 | 1 | 2;
  mo_ta?: string;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_tiet?: PhieuKhoChiTiet[];
}

/** Một dòng trong tab "Chi tiết phiếu": tập hợp thông tin phiếu + một dòng chi tiết hàng hóa. */
export interface ChiTietPhieuKhoFlat {
  /** Id dòng chi tiết (unique cho mỗi row trong bảng) */
  id: string;
  id_phieu_kho: string;
  so_phieu: string;
  ngay: string;
  loai: LoaiPhieuKho;
  id_kho: string;
  ten_kho?: string;
  id_kho_den?: string | null;
  ten_kho_den?: string;
  id_nha_cung_cap?: string | null;
  ten_nha_cung_cap?: string;
  id_khach_hang?: string | null;
  ten_khach_hang?: string;
  trang_thai: 0 | 1 | 2;
  /** Chi tiết dòng */
  id_hang_hoa: string;
  ma_hang?: string;
  ten_hang?: string;
  so_luong: number;
  don_vi_tinh?: string;
  ghi_chu?: string;
}
