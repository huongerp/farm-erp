/** Tab key trong UI (nhap / xuat / chuyen). */
export type LoaiPhieuKhoTab = 'nhap' | 'xuat' | 'chuyen';

/** Loại phiếu lưu DB – tiếng Việt có dấu. */
export type LoaiPhieuKho = 'nhập' | 'xuất' | 'chuyển';

/** Trạng thái phiếu – text lưu DB. */
export type TrangThaiPhieuKho = 'Chờ duyệt' | 'Đã duyệt' | 'Không duyệt';

/** Map tab → giá trị loại gửi DB. */
export const LOAI_TAB_TO_DB: Record<LoaiPhieuKhoTab, LoaiPhieuKho> = {
  nhap: 'nhập',
  xuat: 'xuất',
  chuyen: 'chuyển',
};

/** Map loại từ DB → tab. */
export const LOAI_DB_TO_TAB: Record<LoaiPhieuKho, LoaiPhieuKhoTab> = {
  'nhập': 'nhap',
  'xuất': 'xuat',
  'chuyển': 'chuyen',
};

/** Map trạng thái số (legacy/form) → text DB. */
export const TRANG_THAI_PHIEU_KHO: Record<number, TrangThaiPhieuKho> = {
  0: 'Chờ duyệt',
  1: 'Đã duyệt',
  2: 'Không duyệt',
};

export const TRANG_THAI_PHIEU_KHO_TO_NUM: Record<TrangThaiPhieuKho, number> = {
  'Chờ duyệt': 0,
  'Đã duyệt': 1,
  'Không duyệt': 2,
};

/** Dòng chi tiết phiếu kho: một hàng hóa + số lượng + đơn giá, thành tiền. Khớp bảng fp_mh_phieu_kho_chi_tiet. */
export interface PhieuKhoChiTiet {
  id: string;
  id_phieu_kho: string;
  id_hang_hoa: string;
  /** Tên hàng hóa lưu trên DB (fp_mh_phieu_kho_chi_tiet.ten_hang_hoa). */
  ten_hang_hoa?: string;
  so_luong: number;
  don_gia?: number;
  thanh_tien?: number;
  don_vi_tinh?: string;
  ghi_chu?: string;
  /** Id người tạo dòng (fp_var_nhan_vien.id). */
  nguoi_tao_id?: number | null;
  ten_nguoi_tao?: string;
  tg_tao?: string;
  tg_cap_nhat?: string;
  /** Enrich từ danh sách hàng hóa (ma_hang từ fp_mh_danh_sach_hang_hoa). */
  ma_hang?: string;
  /** Hiển thị: ten_hang_hoa hoặc enrich từ hàng hóa. */
  ten_hang?: string;
}

export interface PhieuKho {
  id: string;
  so_phieu: string;
  ngay: string;
  loai: LoaiPhieuKho;
  kho_id: string;
  ten_kho?: string;
  kho_den_id?: string | null;
  ten_kho_den?: string;
  /** Nhà cung cấp (phiếu nhập). */
  id_nha_cung_cap?: string | null;
  ten_nha_cung_cap?: string;
  /** Khách hàng (phiếu xuất). */
  id_khach_hang?: string | null;
  ten_khach_hang?: string;
  /** Text: "Chờ duyệt" | "Đã duyệt" | "Không duyệt" */
  trang_thai: TrangThaiPhieuKho;
  mo_ta?: string;
  /** Nội dung trao đổi / ghi chú duyệt. */
  trao_doi?: string;
  /** Id người tạo (fp_var_nhan_vien.id, int8). */
  nguoi_tao_id?: number | null;
  ten_nguoi_tao?: string;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_tiet?: PhieuKhoChiTiet[];
  /** Tổng số dòng chi tiết (dùng ở list). */
  tong_so_dong?: number;
  /** Tổng thành tiền các dòng (dùng ở list). */
  tong_tien?: number;
}

/** Một dòng trong tab "Chi tiết phiếu": tập hợp thông tin phiếu + một dòng chi tiết hàng hóa. */
export interface ChiTietPhieuKhoFlat {
  /** Id dòng chi tiết (unique cho mỗi row trong bảng) */
  id: string;
  id_phieu_kho: string;
  so_phieu: string;
  ngay: string;
  loai: LoaiPhieuKho;
  kho_id: string;
  ten_kho?: string;
  kho_den_id?: string | null;
  ten_kho_den?: string;
  id_nha_cung_cap?: string | null;
  ten_nha_cung_cap?: string;
  id_khach_hang?: string | null;
  ten_khach_hang?: string;
  trang_thai: TrangThaiPhieuKho;
  /** Chi tiết dòng */
  id_hang_hoa: string;
  ten_hang_hoa?: string;
  ma_hang?: string;
  ten_hang?: string;
  so_luong: number;
  don_gia?: number;
  thanh_tien?: number;
  don_vi_tinh?: string;
  ghi_chu?: string;
}
