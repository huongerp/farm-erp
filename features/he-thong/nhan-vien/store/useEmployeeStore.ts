
import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import { EmployeeFilters } from '../core/types';
import i18n from '../../../../lib/i18n';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  // ── Hiện mặc định ──
  { id: 'ma_nhan_vien', label: i18n.t('employee.store.codeCol'), visible: true, minWidth: 90, maxWidth: 140, order: 0 },
  { id: 'ho_ten', label: i18n.t('employee.store.nameCol'), visible: true, minWidth: 200, order: 1 },
  { id: 'ten_chuc_vu', label: i18n.t('employee.store.positionDeptCol'), visible: true, minWidth: 160, order: 2 },
  { id: 'email', label: i18n.t('employee.store.emailCol'), visible: true, minWidth: 180, order: 3 },
  { id: 'lien_he', label: i18n.t('employee.store.phoneCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'ngay_vao_lam', label: i18n.t('employee.store.hireDateCol'), visible: true, minWidth: 100, maxWidth: 140, order: 5 },
  { id: 'gioi_tinh', label: i18n.t('employee.store.genderCol'), visible: true, minWidth: 80, maxWidth: 110, order: 6 },
  { id: 'trang_thai', label: i18n.t('employee.store.statusCol'), visible: true, minWidth: 110, maxWidth: 160, order: 7 },
  // ── Ẩn mặc định – chọn trong column chooser ──
  { id: 'ngay_sinh', label: i18n.t('employee.store.birthDateCol'), visible: false, minWidth: 100, maxWidth: 140, order: 8 },
  { id: 'ten_phong_ban', label: i18n.t('employee.store.departmentCol'), visible: false, minWidth: 130, order: 9 },
  { id: 'ten_cap_bac', label: i18n.t('employee.store.levelCol'), visible: false, minWidth: 100, maxWidth: 130, order: 10 },
  { id: 'loai_hop_dong', label: i18n.t('employee.store.contractCol'), visible: false, minWidth: 110, maxWidth: 150, order: 11 },
  { id: 'ten_chi_nhanh', label: i18n.t('employee.store.branchCol'), visible: false, minWidth: 150, order: 12 },
  { id: 'noi_lam_viec', label: i18n.t('employee.store.workplaceCol'), visible: false, minWidth: 140, order: 13 },
  { id: 'tinh_thanh', label: i18n.t('employee.store.provinceCol'), visible: false, minWidth: 120, order: 14 },
  { id: 'trinh_do_hoc_van', label: i18n.t('employee.store.educationCol'), visible: false, minWidth: 100, maxWidth: 130, order: 15 },
  { id: 'cmnd_cccd', label: i18n.t('employee.store.idCardCol'), visible: false, minWidth: 120, maxWidth: 150, order: 16 },
];

const initialFilters: EmployeeFilters = {
  trang_thai: [],
  id_phong_ban: [],
  gender: [],
  position: []
};

export const useEmployeeStore = createGenericStore<EmployeeFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
