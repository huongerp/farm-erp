/** Loại kết quả: dùng trong đề xuất tuyển dụng để tính số đã tuyển / đã nghỉ / còn lại */
export type LoaiKetQuaTrangThai = 'onboard' | 'nghi';

/** Trạng thái ứng viên (pipeline: Mới, Đang xem, Mời PV, Từ chối, Nhận việc...) */
export interface TrangThaiUngVien {
  id: string;
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  /** onboard = đã tuyển/đang làm; nghi = đã nghỉ; null = không áp dụng (trạng thái trung gian) */
  loai_ket_qua?: LoaiKetQuaTrangThai | null;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface TrangThaiUngVienFormState {
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: number;
}

/** Kênh tuyển dụng (Website, LinkedIn, Referral, Job fair...) */
export interface KenhTuyenDung {
  id: string;
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface KenhTuyenDungFormState {
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: number;
}

/** Mẫu phản hồi / Thư mặc định (từ chối, mời PV, thư mời nhận việc...) */
export interface MauPhanHoi {
  id: string;
  ma: string;
  ten_loai: string;
  tieu_de: string;
  noi_dung_mau: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface MauPhanHoiFormState {
  ma: string;
  ten_loai: string;
  tieu_de: string;
  noi_dung_mau: string;
  trang_thai: number;
}
