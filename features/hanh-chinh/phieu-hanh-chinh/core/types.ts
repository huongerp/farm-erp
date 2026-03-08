import type { AdminFormType } from '../../thiet-lap-cong-luong/core/constants';
import type { AdminFormShift, AdminFormStatus, ApprovalStatus } from './constants';

export interface AdminFormRequest {
  id: string;
  loai_phieu: AdminFormType;
  ca: AdminFormShift;
  ngay: string;
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

export interface AdminFormRequestFormState {
  loai_phieu: AdminFormType | '';
  ca: AdminFormShift | '';
  ngay: string;
  ly_do: string;
}

export interface AdminFormQuotaRow {
  id: string;
  loai_phieu: AdminFormType;
  so_luong_thang: number;
  da_dung: number;
  con_lai: number;
}
