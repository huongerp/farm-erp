import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ChecklistBanGiaoFilters {
  trang_thai: string[];
  id_mau: string[];
  /** YYYY-MM-DD */
  ngay_from: string | null;
  ngay_to: string | null;
}

const col = (id: string, key: string, minWidth: number, maxWidth: number, order: number): ColumnConfig => ({
  id,
  label: i18n.t(`checklistBanGiao.col.${key}`),
  visible: true,
  minWidth,
  maxWidth,
  order,
});

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  col('so_phieu', 'soPhieu', 150, 210, 0),
  col('ngay', 'ngay', 110, 140, 1),
  col('ca', 'ca', 70, 100, 2),
  col('khu_vuc', 'khuVuc', 110, 170, 3),
  col('ten_mau', 'tenMau', 150, 260, 4),
  col('trang_thai', 'trangThai', 120, 150, 5),
  col('kq_thuc_hien', 'kqThucHien', 90, 120, 6),
  col('ten_ben_thuc_hien', 'benThucHien', 140, 200, 7),
  col('ten_ben_kiem_tra', 'benKiemTra', 140, 200, 8),
  col('so_lan_tra_lai', 'soLanTraLai', 80, 110, 9),
  col('ten_nguoi_tao', 'nguoiTao', 120, 190, 10),
  col('ten_nguoi_nhan', 'nguoiNhan', 120, 190, 11),
  col('ghi_chu', 'ghiChu', 120, 260, 12),
  { id: 'actions', label: '', visible: true, order: 13 },
];

const initialFilters: ChecklistBanGiaoFilters = {
  trang_thai: [],
  id_mau: [],
  ngay_from: null,
  ngay_to: null,
};

export const useChecklistBanGiaoStore = createGenericStore<ChecklistBanGiaoFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-checklist-ban-giao'
);
