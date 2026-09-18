/** Các cột theo thứ trong tuần (DB: ke_hoach_t2 … ke_hoach_cn, thuc_te_*) */
export const THU_HOACH_DAY_SUFFIXES = ['t2', 't3', 't4', 't5', 't6', 't7', 'cn'] as const;
export type ThuHoachDaySuffix = (typeof THU_HOACH_DAY_SUFFIXES)[number];

export type KeHoachDayKey = `ke_hoach_${ThuHoachDaySuffix}`;
export type ThucTeDayKey = `thuc_te_${ThuHoachDaySuffix}`;

export interface FarmThuHoach {
  id: string;
  nam: number;
  tuan: number;
  id_chi_nhanh: string | null;
  ten_chi_nhanh: string | null;
  ke_hoach_t2: number;
  ke_hoach_t3: number;
  ke_hoach_t4: number;
  ke_hoach_t5: number;
  ke_hoach_t6: number;
  ke_hoach_t7: number;
  ke_hoach_cn: number;
  thuc_te_t2: number;
  thuc_te_t3: number;
  thuc_te_t4: number;
  thuc_te_t5: number;
  thuc_te_t6: number;
  thuc_te_t7: number;
  thuc_te_cn: number;
  du_thu_tuan: number;
  thu_du_kien: ThuHoachDaySuffix[];
  ghi_chu: string | null;
  trao_doi: string | null;
  id_nguoi_tao: string | null;
  /** Họ tên hiển thị — gắn từ danh mục nhân viên khi tải danh sách/chi tiết */
  ten_nguoi_tao: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}
