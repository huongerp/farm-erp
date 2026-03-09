import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DanhMucDoiTacFilters {
  status: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('doiTac.danhMuc.form.thuTu'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'loai', label: i18n.t('doiTac.danhMuc.form.loai'), visible: true, minWidth: 120, maxWidth: 180, order: 1 },
  { id: 'ma_nhom', label: i18n.t('doiTac.danhMuc.form.maNhom'), visible: true, minWidth: 100, maxWidth: 160, order: 2 },
  { id: 'ten_nhom', label: i18n.t('doiTac.danhMuc.form.tenNhom'), visible: true, minWidth: 160, maxWidth: 280, order: 3 },
  { id: 'trang_thai', label: i18n.t('doiTac.danhMuc.form.trangThai'), visible: true, minWidth: 120, maxWidth: 180, order: 4 },
];

const initialFilters: DanhMucDoiTacFilters = {
  status: [],
};

export const useDanhMucDoiTacStore = createGenericStore<DanhMucDoiTacFilters>(initialFilters, DEFAULT_COLUMNS);
