/** Danh mục hàng hóa farm: 2 cấp (cha id_cha null, con id_cha = id cha). */
export interface FarmDanhMuc {
  id: string;
  ma_danh_muc: string;
  ten_danh_muc: string;
  id_cha: string | null;
  thu_tu: number;
  mo_ta?: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Hàng hóa farm: liên kết danh mục cấp 2 / cấp 1. */
export interface FarmHangHoa {
  id: string;
  danh_muc_id: string | null;
  danh_muc_cha_id: string | null;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  dvt: string | null;
  don_gia: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
  ten_danh_muc?: string;
  ma_hang: string;
  ten_hang: string;
  don_vi_tinh: string | null;
  mo_ta?: string | null;
}
