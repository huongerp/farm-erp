import type { TrangThaiHoatDong } from '../../../../lib/constants';

/** 7 quyền: Xem, Thêm, Sửa, Xoá, Phê duyệt (một số module), Quản trị, Tất cả */
export type ActionType = 'view' | 'create' | 'update' | 'delete' | 'approve' | 'admin' | 'all';

export interface ModulePermission {
  module_id: string;
  module_name: string;
  actions: ActionType[];
}

export interface PositionPermission {
  id: string;
  id_chuc_vu: string;
  ten_chuc_vu: string;
  ma_chuc_vu: string;
  ten_phong_ban: string;
  thu_tu_phong_ban?: number;
  thu_tu_chuc_vu?: number;
  mo_ta: string | null;
  so_nhan_vien: number;
  quyen_han: ModulePermission[];
  trang_thai: TrangThaiHoatDong;
  tg_cap_nhat: string;
}

export interface AccessLog {
  id: string;
  id_nguoi_dung: string;
  ten_nguoi_dung: string;
  hanh_dong: string;
  mo_ta: string;
  dia_chi_ip: string;
  thiet_bi: string;
  trang_thai: 'Success' | 'Failed' | 'Warning';
  tg_thuc_hien: string;
}

export interface RoleFilters {
  trang_thai: 'All' | 'Active' | 'Inactive';
  id_phong_ban: string;
}

// Add LogFilters interface to fix missing export error
export interface LogFilters {
  trang_thai: 'All' | 'Success' | 'Failed' | 'Warning';
}
