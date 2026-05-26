/** Trạng thái phiếu: chờ duyệt, đã duyệt, không duyệt */
export type TrangThaiPhieu = 'cho_duyet' | 'da_duyet' | 'khong_duyet';

/** Phiếu bảo trì / sửa chữa – yêu cầu bảo trì hoặc sửa chữa tài sản */
export interface PhieuBaoTriSuaChua {
  id: string;
  /** Mã phiếu tự sinh: CPTS-0001, CPTS-0002, ... */
  ma_phieu: string;
  ngay: string;
  id_tai_san: string;
  ma_tai_san?: string;
  ten_tai_san?: string;
  /** ID loại chi phí (fp_ts_loai_chi_phi) hoặc giá trị legacy: bao_tri | sua_chua */
  id_hang_muc: string;
  ten_hang_muc?: string;
  mo_ta: string;
  so_tien: number;
  ghi_chu?: string | null;
  trang_thai: TrangThaiPhieu;
  nguoi_duyet?: string | null;
  id_nguoi_tao: string;
  ten_nguoi_tao?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Payload tạo/sửa phiếu */
export interface PhieuBaoTriSuaChuaCreate {
  ngay: string;
  id_tai_san: string;
  id_hang_muc: string;
  /** Lưu tắt theo thiết lập loại chi phí khi tạo/cập nhật */
  ten_hang_muc?: string | null;
  mo_ta: string;
  so_tien: number;
  ghi_chu?: string | null;
  /** Chỉ dùng khi cập nhật phiếu */
  trang_thai?: TrangThaiPhieu;
  nguoi_duyet?: string | null;
}
