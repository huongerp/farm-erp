import type { AdminFormType } from '../../thiet-lap-cong-luong/core/constants';
import type { AdminFormShift, AdminFormStatus, ApprovalStatus } from './constants';
import type { AdminFormSession } from './khoang-nghi';

export interface AdminFormRequest {
  id: string;
  loai_phieu: AdminFormType;
  /** Ca của phiếu trong 1 ngày; phiếu nhiều ngày lấy 'full' cho hiển thị cũ. */
  ca: AdminFormShift;
  /** Từ ngày (yyyy-mm-dd) — cột `ngay` ở DB. */
  ngay: string;
  den_ngay: string;
  tu_buoi: AdminFormSession;
  den_buoi: AdminFormSession;
  ly_do: string;
  nguoi_tao_id: string;
  ten_nguoi_tao: string;
  id_phong_ban?: string | null;
  ten_phong_ban?: string | null;
  quan_ly_id?: string | null;
  ten_quan_ly?: string | null;
  hcns_id?: string | null;
  ten_hcns?: string | null;
  trang_thai_quan_ly: ApprovalStatus;
  trang_thai_hcns: ApprovalStatus;
  trang_thai: AdminFormStatus;
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Vài cột cho chip lọc / số đếm — tính trên toàn bộ phạm vi, không theo trang. */
export interface AdminFormTomTat {
  id: string;
  nguoi_tao_id: string;
  ten_nguoi_tao: string;
  loai_phieu: AdminFormType;
  trang_thai: AdminFormStatus;
  ngay: string;
  den_ngay: string;
}

export interface AdminFormQuotaRow {
  id: string;
  loai_phieu: AdminFormType;
  so_luong_thang: number;
  da_dung: number;
  con_lai: number;
}
