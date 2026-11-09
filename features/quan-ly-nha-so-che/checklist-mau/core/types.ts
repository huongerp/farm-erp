/**
 * Mẫu checklist công đoạn — DB: fp_farm_cl_mau, fp_farm_cl_mau_muc, fp_farm_cl_mau_hang_muc
 * (migration 073). Id bigint đọc về dạng string như các module sơ chế khác.
 */

/** ban_giao: phiếu 2 cột tích theo ngày | ve_sinh_tuan: lưới T2–CN (đợt 2). */
export const LOAI_MAU_CL = ['ban_giao', 've_sinh_tuan'] as const;
export type LoaiMauCl = (typeof LOAI_MAU_CL)[number];

export interface MauChecklist {
  id: string;
  /** Mã biểu mẫu, vd BM-KT */
  ma: string | null;
  ten: string;
  mo_ta: string | null;
  loai: LoaiMauCl;
  /** Nhãn cột khâu làm, vd "Bộ phận đóng gói" */
  ten_ben_thuc_hien: string;
  /** Nhãn cột khâu sau, vd "Kho kiểm tra lại" */
  ten_ben_kiem_tra: string;
  /** Chức vụ được làm khâu trước. Rỗng = ai có quyền tạo phiếu. */
  chuc_vu_thuc_hien_ids: string[];
  /** Chức vụ khâu sau. Rỗng = không có khâu kiểm tra lại (Chuyển là hoàn thành luôn). */
  chuc_vu_kiem_tra_ids: string[];
  /** Phiếu có khối kết luận: đủ điều kiện / có điều kiện / tạm dừng. */
  co_ket_luan_van_hanh: boolean;
  /** Ghi chú cuối biểu mẫu (in ở chân phiếu). */
  ghi_chu_cuoi: string | null;
  dang_dung: boolean;
  thu_tu: number;
  id_nguoi_tao: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Mục (nhóm hạng mục): "I. THIẾT BỊ RỬA & VỆ SINH CHUỐI"… */
export interface MucMauChecklist {
  id: string;
  id_mau: string;
  ten: string;
  thu_tu: number;
}

/** Tần suất việc vệ sinh tuần (đợt 2). `thu`: 2..7 = T2..T7, 8 = CN. */
export type TanSuatVeSinh =
  | { kieu: 'hang_ngay' }
  | { kieu: 'thu'; thu: number[] }
  | { kieu: 'cuoi_thang'; thu: number };

export interface HangMucMauChecklist {
  id: string;
  id_mau: string;
  id_muc: string | null;
  /** Tên thiết bị / công đoạn / đầu việc */
  doi_tuong: string;
  tieu_chuan: string | null;
  phuong_phap: string | null;
  /** Hạng mục trọng yếu (★) */
  quan_trong: boolean;
  /** Liên kết thiết bị bảo dưỡng → phiếu hiện Mã TS + tần suất bảo dưỡng */
  id_thiet_bi: string | null;
  tan_suat: TanSuatVeSinh | null;
  dang_dung: boolean;
  thu_tu: number;
}
