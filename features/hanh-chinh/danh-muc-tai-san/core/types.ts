/** Tài sản - danh sách tài sản, liên kết Thiết lập tài sản (nhóm, nơi lưu, trạng thái) */
export interface TaiSan {
  id: string;
  ma_tai_san: string;
  ten_tai_san: string;
  id_nhom: string;
  ten_nhom?: string;
  id_noi_luu: string;
  ten_noi_luu?: string;
  id_chi_nhanh?: string | null;
  ten_chi_nhanh?: string | null;
  id_trang_thai: string;
  ten_trang_thai?: string;
  /** Nhân viên đang giữ (cấp phát) - null nếu đang ở kho/nơi lưu */
  id_nhan_vien_dang_giu?: string | null;
  ten_nhan_vien_dang_giu?: string | null;
  ma_nhan_vien_dang_giu?: string | null;
  /** Thương hiệu */
  thuong_hieu?: string | null;
  /** Model */
  model?: string | null;
  /** Số serial */
  serial?: string | null;
  /** Xuất xứ */
  xuat_xu?: string | null;
  /** Mã Barcode */
  ma_barcode?: string | null;
  /** Nhà cung cấp (id hoặc tên tùy nguồn) */
  id_nha_cung_cap?: string | null;
  ten_nha_cung_cap?: string | null;
  /** Người tạo (nhân viên tạo bản ghi) */
  id_nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
  ngay_nhap: string;
  nguyen_gia?: number | null;
  /** Ngày bắt đầu trích khấu hao (YYYY-MM-DD); mặc định = ngay_nhap */
  ngay_bat_dau_trich_khau_hao?: string | null;
  /** Giá trị còn lại (cập nhật khi chốt kỳ khấu hao) */
  gia_tri_con_lai?: number | null;
  /** Khấu hao lũy kế (cập nhật khi chốt kỳ khấu hao) */
  khau_hao_luy_ke?: number | null;
  /** URL ảnh tài sản (mẫu hoặc upload) */
  hinh_anh?: string | null;
  ghi_chu?: string | null;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface TaiSanFormState {
  ma_tai_san: string;
  ten_tai_san: string;
  id_nhom: string;
  id_noi_luu: string;
  id_trang_thai: string;
  id_nhan_vien_dang_giu?: string | null;
  thuong_hieu?: string | null;
  model?: string | null;
  serial?: string | null;
  xuat_xu?: string | null;
  ma_barcode?: string | null;
  id_nha_cung_cap?: string | null;
  ten_nha_cung_cap?: string | null;
  ngay_nhap: string;
  nguyen_gia?: number | null;
  ngay_bat_dau_trich_khau_hao?: string | null;
  ghi_chu?: string | null;
  trang_thai: number;
}
