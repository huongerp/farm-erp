/** Danh mục hàng hóa: 2 cấp (cha id_cha null, con id_cha = id cha). */
export interface DanhMucHangHoa {
  id: string;
  ma_danh_muc: string;
  ten_danh_muc: string;
  id_cha: string | null;
  thu_tu: number;
  mo_ta?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}
