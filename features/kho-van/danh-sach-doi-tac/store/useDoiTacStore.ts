import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DoiTacFilters {
  status: string[];
  id_nhom: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('doiTac.store.orderCol'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'loai_doi_tac', label: i18n.t('doiTac.store.loaiCol'), visible: true, minWidth: 120, maxWidth: 160, order: 1 },
  { id: 'ma_ncc', label: i18n.t('doiTac.store.codeCol'), visible: true, minWidth: 120, maxWidth: 180, order: 2 },
  { id: 'ten_ncc', label: i18n.t('doiTac.store.nameCol'), visible: true, minWidth: 180, maxWidth: 320, order: 3 },
  { id: 'ten_nhom', label: i18n.t('doiTac.store.groupCol'), visible: true, minWidth: 140, maxWidth: 220, order: 4 },
  { id: 'dien_thoai', label: i18n.t('doiTac.store.phoneCol'), visible: true, minWidth: 110, maxWidth: 160, order: 5 },
  { id: 'tags', label: i18n.t('doiTac.store.tagsCol'), visible: true, minWidth: 140, maxWidth: 260, order: 6 },
  { id: 'trang_thai', label: i18n.t('doiTac.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 7 },
  { id: 'tg_cap_nhat', label: i18n.t('doiTac.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 8 },
];

const initialFilters: DoiTacFilters = {
  status: [],
  id_nhom: [],
};

export const useDoiTacStore = createGenericStore<DoiTacFilters>(initialFilters, DEFAULT_COLUMNS);
