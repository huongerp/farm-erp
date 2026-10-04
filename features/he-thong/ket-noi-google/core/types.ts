/** Một nhân viên đã kết nối Google — từ rpc_qt_ket_noi_google_ds (không có cột token). */
export interface KetNoiGoogle {
  /** id nhân viên dạng chuỗi — khoá dòng cho GenericTable. */
  id: string;
  nhan_vien_id: number;
  ho_va_ten: string | null;
  ten_phong_ban: string | null;
  ten_chuc_vu: string | null;
  trang_thai_nhan_vien: string | null;
  google_email: string;
  /** 'hong' = Google thu hồi token (người dùng gỡ quyền / đổi mật khẩu). */
  trang_thai: 'hoat_dong' | 'hong';
  tg_tao: string;
  tg_cap_nhat: string;
  so_lich: number;
  so_lich_dang_bat: number;
  so_lich_loi: number;
  lan_dong_bo_cuoi: string | null;
}

/** Lịch đồng bộ — từ rpc_qt_lich_dong_bo_ds. */
export interface LichDongBoQt {
  id: number;
  nhan_vien_id: number;
  module_id: string;
  ten_file: string | null;
  sheet_title: string;
  spreadsheet_url: string;
  tan_suat: 'khi_thay_doi' | 'moi_gio' | 'moi_4_gio' | 'hang_ngay' | 'hang_tuan' | 'hang_thang';
  gio: number | null;
  thu: number | null;
  ngay_thang: number | null;
  bat: boolean;
  can_chay: boolean;
  lan_chay_cuoi: string | null;
  ket_qua_cuoi: 'ok' | 'loi' | null;
  thong_diep_cuoi: string | null;
  so_dong_cuoi: number | null;
  so_loi_lien_tiep: number;
  lan_chay_ke_tiep: string | null;
  so_cot: number;
  tg_tao: string;
}
