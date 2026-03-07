/** Cấu hình cảnh báo công việc (một bản ghi toàn hệ thống) */
export interface CauHinhCongViec {
  so_ngay_canh_bao_sap_han: number;
  bat_canh_bao_qua_han: boolean;
}

/** Mẫu công việc (template) dùng khi tạo công việc mới */
export interface MauCongViec {
  id: string;
  ten_mau: string;
  tieu_de_mac_dinh: string;
  mo_ta_mac_dinh: string;
  uu_tien_mac_dinh: 'cao' | 'trung_binh' | 'thap';
  trang_thai_mac_dinh: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface MauCongViecFormState {
  ten_mau: string;
  tieu_de_mac_dinh: string;
  mo_ta_mac_dinh: string;
  uu_tien_mac_dinh: 'cao' | 'trung_binh' | 'thap';
  trang_thai_mac_dinh: number;
}
