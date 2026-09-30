import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface AdminFormListFilters {
  status: string[];
  type: string[];
  /** Người gửi (id nhân viên) — chỉ người có viewAll mới thấy chip này. */
  nguoiTao: string[];
  month: string;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('adminForm.store.dateCol'), visible: true, minWidth: 110, order: 0 },
  { id: 'loai_phieu', label: i18n.t('adminForm.store.typeCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'thoi_gian', label: i18n.t('adminForm.store.periodCol'), visible: true, minWidth: 180, order: 2 },
  { id: 'so_ngay', label: i18n.t('adminForm.store.daysCol'), visible: true, minWidth: 90, order: 3 },
  { id: 'ly_do', label: i18n.t('adminForm.store.reasonCol'), visible: true, minWidth: 180, order: 4 },
  { id: 'trang_thai', label: i18n.t('adminForm.store.statusCol'), visible: true, minWidth: 120, order: 5 },
  { id: 'ten_nguoi_tao', label: i18n.t('adminForm.store.requesterCol'), visible: true, minWidth: 160, order: 6 },
  { id: 'ten_phong_ban', label: i18n.t('adminForm.store.departmentCol'), visible: false, minWidth: 140, order: 7 },
  { id: 'tg_cap_nhat', label: i18n.t('adminForm.store.updatedCol'), visible: false, minWidth: 140, order: 8 },
];

const initialFilters: AdminFormListFilters = {
  status: [],
  type: [],
  nguoiTao: [],
  month: '',
};

/** Giữ storageKey cũ của tab "Tôi quản lý" để người duyệt không mất cấu hình cột. */
export const useAdminFormListStore = createGenericStore<AdminFormListFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-phieu-hanh-chinh-admin-form-managed'
);
