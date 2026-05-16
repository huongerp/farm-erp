/** `mo` = đang mở, `khoa` = đã khóa (chỉ quản trị sửa/xóa). */
export type TrangThaiDuBaoSlDongThungPhieu = 'mo' | 'khoa';

export const TRANG_THAI_DU_BAO_SL_DONG_THUNG = {
  MO: 'mo' as const,
  KHOA: 'khoa' as const,
} as const;

export interface FarmDuBaoSlDongThung {
  id: string;
  ngay: string;
  id_chi_nhanh: string | null;
  ten_chi_nhanh: string | null;
  so_buong_can_mau: number;
  tong_can_nang_mau: number;
  tong_buong_nhap_ke_hoach: number;
  /** 0–1 */
  ty_le_thu_hoi_ke_hoach: number;
  quy_cach_dong_thung_ke_hoach: number;
  tong_buong_nhap_thuc_te: number;
  ty_le_thu_hoi_thuc_te: number;
  quy_cach_dong_thung_thuc_te: number;
  ghi_chu: string | null;
  id_nguoi_tao: string | null;
  ten_nguoi_tao: string | null;
  trang_thai: TrangThaiDuBaoSlDongThungPhieu;
  tg_tao: string;
  tg_cap_nhat: string;
}
