import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DangKyDaoTaoFilters {
  trang_thai: string[];
  id_khoa_hoc: string[];
  id_loai_khoa_hoc: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_khoa_hoc', label: i18n.t('dangKyDaoTao.table.maKhoa'), visible: true, minWidth: 100, order: 0 },
  { id: 'ten_khoa_hoc', label: i18n.t('dangKyDaoTao.table.tenKhoa'), visible: true, minWidth: 160, maxWidth: 280, order: 1 },
  { id: 'ten_nhan_vien', label: i18n.t('dangKyDaoTao.table.nhanVien'), visible: true, minWidth: 120, maxWidth: 200, order: 2 },
  { id: 'loai_dang_ky', label: i18n.t('dangKyDaoTao.table.loaiDangKy'), visible: true, minWidth: 100, order: 3 },
  { id: 'trang_thai', label: i18n.t('dangKyDaoTao.table.trangThai'), visible: true, minWidth: 100, order: 4 },
  { id: 'tien_do', label: i18n.t('dangKyDaoTao.table.tienDo'), visible: true, minWidth: 100, order: 5 },
  { id: 'tg_dang_ky', label: i18n.t('dangKyDaoTao.table.ngayDangKy'), visible: true, minWidth: 120, order: 6 },
  { id: 'actions', label: i18n.t('common.actions'), visible: true, minWidth: 80, order: 7 },
];

const initialFilters: DangKyDaoTaoFilters = {
  trang_thai: [],
  id_khoa_hoc: [],
  id_loai_khoa_hoc: [],
};

export const useDangKyDaoTaoStore = createGenericStore<DangKyDaoTaoFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
