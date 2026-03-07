/** Sứ mệnh phòng ban */
export interface DeptMission {
  id: string;
  id_phong_ban: string;
  noi_dung: string;
  thu_tu: number;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Chức năng phòng ban */
export interface DeptFunction {
  id: string;
  id_phong_ban: string;
  ma_chuc_nang: string;
  ten_chuc_nang: string;
  mo_ta: string | null;
  thu_tu: number;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Nhóm chịu trách nhiệm (enum cho nhiệm vụ) – từ đó xác định chức năng liên quan đến nhóm nào */
export const TASK_RESPONSIBLE_GROUP_CODES = [
  'technical',
  'sales',
  'hr',
  'finance',
  'admin',
  'operations',
  'other',
] as const;
export type TaskResponsibleGroupCode = (typeof TASK_RESPONSIBLE_GROUP_CODES)[number];

/** Nhiệm vụ (thuộc chức năng) */
export interface Task {
  id: string;
  id_chuc_nang: string;
  ma_nhiem_vu: string;
  ten_nhiem_vu: string;
  mo_ta: string | null;
  /** Nhóm chịu trách nhiệm (enum) – xác định chức năng liên quan đến nhóm nào */
  nhom_chiu_trach_nhiem: TaskResponsibleGroupCode | null;
  thu_tu: number;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Populated: tên chức năng (để hiển thị) */
  ten_chuc_nang?: string;
  /** Populated: id_phong_ban từ chức năng (để filter) */
  id_phong_ban?: string;
}

/** Chỉ số KPI (thuộc nhiệm vụ) */
export type KpiCycle = 'month' | 'quarter' | 'year';

export interface KpiIndicator {
  id: string;
  id_nhiem_vu: string;
  ten_chi_so: string;
  don_vi: string;
  chi_tieu_nguong: string;
  chu_ky_danh_gia: KpiCycle;
  thu_tu: number;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Populated: tên nhiệm vụ */
  ten_nhiem_vu?: string;
}
