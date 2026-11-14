/** Một hồ pha phèn của NSC (fp_farm_pp_ho). */
export interface HoPhen {
  id: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  ten_ho: string;
  the_tich_xan_m3: number | null;
  the_tich_tia_m3: number | null;
  bo_sung_xan_kg: number | null;
  bo_sung_tia_kg: number | null;
  ty_le_g_lit: number | null;
  ty_le_dau_ca: number | null;
  dang_dung: boolean;
  thu_tu: number;
  ghi_chu: string | null;
}

/** Một lần pha trong ngày (fp_farm_pp_nhat_ky_lan). */
export interface LanPha {
  lan: number;
  /** HH:mm */
  gio: string | null;
  so_kg: number | null;
  /** Định mức chụp lúc lưu. */
  dinh_muc_kg: number | null;
}

/** Một lần pha phẳng kèm vài cột của phiếu cha — tab Chi tiết. */
export interface NhatKyPhaPhenLanRow {
  id: string;
  id_nhat_ky: string;
  ngay: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  ten_nhan_vien_phu_trach: string | null;
  lan: number;
  /** HH:mm */
  gio: string | null;
  so_kg: number | null;
  dinh_muc_kg: number | null;
  /** so_kg − dinh_muc_kg; null khi thiếu một trong hai. */
  chenh_lech: number | null;
}

/** Nhật ký pha phèn một ngày của một NSC (fp_farm_pp_nhat_ky + các lần pha). */
export interface NhatKyPhaPhen {
  id: string;
  ngay: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  so_buong_du_thu: number | null;
  so_be_so_che: number | null;
  id_nhan_vien_phu_trach: string | null;
  ten_nhan_vien_phu_trach: string | null;
  ghi_chu: string | null;
  id_nguoi_tao: string | null;
  ten_nguoi_tao: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Sắp theo `lan` tăng dần. */
  lan: LanPha[];
  tong_thuc_te: number;
  tong_dinh_muc: number;
  chenh_lech: number;
}
