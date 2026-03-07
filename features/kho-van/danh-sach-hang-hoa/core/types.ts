/** Hàng hóa: liên kết Danh mục hàng hóa qua id_danh_muc; ten_danh_muc enrich từ service. */
export interface HangHoa {
  id: string;
  ma_hang: string;
  ten_hang: string;
  id_danh_muc: string | null;
  ten_danh_muc?: string;
  don_vi_tinh?: string;
  /** Tồn tối thiểu – dùng để cảnh báo khi tồn thực tế thấp hơn */
  ton_toi_thieu?: number;
  mo_ta?: string;
  /** URL hoặc base64 hình ảnh sản phẩm */
  hinh_anh?: string | null;
  trang_thai: 0 | 1;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}
