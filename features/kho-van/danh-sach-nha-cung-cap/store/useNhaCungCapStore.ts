import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface NhaCungCapFilters {
  status: string[];
  id_nhom: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('nhaCungCap.store.orderCol'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'ma_ncc', label: i18n.t('nhaCungCap.store.codeCol'), visible: true, minWidth: 120, maxWidth: 180, order: 1 },
  { id: 'ten_ncc', label: i18n.t('nhaCungCap.store.nameCol'), visible: true, minWidth: 180, maxWidth: 320, order: 2 },
  { id: 'ten_nhom', label: i18n.t('nhaCungCap.store.groupCol'), visible: true, minWidth: 140, maxWidth: 220, order: 3 },
  { id: 'dien_thoai', label: i18n.t('nhaCungCap.store.phoneCol'), visible: true, minWidth: 110, maxWidth: 160, order: 4 },
  { id: 'tags', label: i18n.t('nhaCungCap.store.tagsCol'), visible: true, minWidth: 140, maxWidth: 260, order: 5 },
  { id: 'trang_thai', label: i18n.t('nhaCungCap.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('nhaCungCap.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 7 },
];

const initialFilters: NhaCungCapFilters = {
  status: [],
  id_nhom: [],
};

export const useNhaCungCapStore = createGenericStore<NhaCungCapFilters>(initialFilters, DEFAULT_COLUMNS);
