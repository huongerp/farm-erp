import type { TrangThaiHoatDong } from '../../../../lib/constants';

/** Hàng hóa: liên kết Danh mục cấp 2 (danh_muc_id), danh mục cấp 1 (danh_muc_cha_id). Hiển thị ten_danh_muc = "Cấp 1 / Cấp 2". */
export interface HangHoa {
  id: string;
  danh_muc_id: string | null;
  danh_muc_cha_id: string | null;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  dvt: string | null;
  thu_tu: number;
  trang_thai: TrangThaiHoatDong;
  don_gia: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Hiển thị "Tên cấp 1 / Tên cấp 2" (enrich từ service). */
  ten_danh_muc?: string;
  /** Bản đồ tương thích: dùng trong phiếu kho, báo cáo, tồn kho ( = ma_hang_hoa ). */
  ma_hang: string;
  /** Bản đồ tương thích ( = ten_hang_hoa ). */
  ten_hang: string;
  /** Bản đồ tương thích ( = dvt ). */
  don_vi_tinh: string | null;
  /** Mô tả hàng hóa (cột mo_ta trên Supabase). */
  mo_ta?: string | null;
  /** URL hình ảnh (cột hinh_anh, lưu từ Cloudinary). */
  hinh_anh?: string | null;
}
