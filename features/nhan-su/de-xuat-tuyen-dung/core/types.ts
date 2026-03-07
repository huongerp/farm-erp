/** Đề xuất tuyển dụng: gắn với chức vụ (Position), có mô tả, yêu cầu, link, số lượng, trạng thái. */
export interface DeXuatTuyenDung {
  id: string;
  id_chuc_vu: string;
  ma_de_xuat: string;
  tieu_de: string | null;
  mo_ta: string;
  yeu_cau: string;
  link_tuyen: string;
  so_luong: number;
  /** Số lượng đã tuyển (lưu DB; nếu có counts từ ứng viên thì dùng so_luong_onboard để hiển thị) */
  so_luong_da_tuyen: number;
  han_nop: string | null;
  /** 0: Nháp, 1: Chờ duyệt, 2: Đã duyệt, 3: Từ chối */
  trang_thai: 0 | 1 | 2 | 3;
  /** Ghi chú khi chuyển trạng thái (tùy chọn) */
  ghi_chu: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Display: từ Position */
  ten_chuc_vu?: string;
  ten_phong_ban?: string;
}

/** Số liệu tính từ ứng viên + trạng thái ứng viên (onboard / nghỉ). */
export interface DeXuatTuyenDungCounts {
  /** Số ứng viên đang ở trạng thái onboard (đã tuyển / đang làm). */
  so_luong_onboard: number;
  /** Số ứng viên đã tuyển nhưng đã nghỉ (trạng thái loại "nghỉ việc"). */
  so_luong_da_nghi: number;
  /** so_luong - so_luong_onboard (số vị trí còn cần tuyển). */
  so_luong_con_lai: number;
}

export type DeXuatTuyenDungWithCounts = DeXuatTuyenDung & DeXuatTuyenDungCounts;

export interface DeXuatTuyenDungFormState {
  id_chuc_vu: string;
  ma_de_xuat: string;
  tieu_de: string | null;
  mo_ta: string;
  yeu_cau: string;
  link_tuyen: string;
  so_luong: number;
  so_luong_da_tuyen: number;
  han_nop: string | null;
  trang_thai: number;
}
