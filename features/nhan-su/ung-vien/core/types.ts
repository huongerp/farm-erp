/** Tài liệu đính kèm ứng viên (CV, bằng cấp, ...) */
export interface TaiLieuUngVien {
  id: string;
  ten_file: string;
  loai?: string;
  /** URL hoặc data URL (base64) */
  link?: string;
}

/** Ứng viên: hồ sơ ứng tuyển gắn với đề xuất tuyển dụng, trạng thái, tài liệu. */
export interface UngVien {
  id: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  dia_chi?: string | null;
  ngay_sinh?: string | null;
  ghi_chu_noi_bo?: string | null;
  /** Vị trí ứng tuyển - FK Đề xuất tuyển dụng */
  id_de_xuat_tuyen_dung: string;
  /** Trạng thái ứng viên - FK Thiết lập tuyển dụng */
  id_trang_thai_ung_vien: string;
  /** Nguồn ứng tuyển - FK Kênh tuyển dụng */
  id_kenh_tuyen_dung?: string | null;
  ngay_phong_van_gan_nhat?: string | null;
  ket_qua_phan_hoi_gan_nhat?: string | null;
  tai_lieu: TaiLieuUngVien[];
  tg_tao: string;
  tg_cap_nhat: string;
  /** Enrich từ Đề xuất */
  ma_de_xuat?: string;
  ten_chuc_vu?: string;
  /** Enrich từ Trạng thái ứng viên */
  ten_trang_thai?: string;
  /** Enrich từ Kênh tuyển dụng */
  ten_kenh_tuyen_dung?: string;
}
