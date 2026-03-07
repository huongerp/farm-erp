import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ChienLuocFilters {
  nam: number | null;
  trang_thai_duyet: string[];
  trang_thai_trien_khai: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten', label: i18n.t('chienLuoc.col.ten'), visible: true, minWidth: 180, maxWidth: 280, order: 0 },
  { id: 'nam', label: i18n.t('chienLuoc.col.nam'), visible: true, minWidth: 80, maxWidth: 100, order: 1 },
  { id: 'loai_tows', label: i18n.t('chienLuoc.col.loaiTows'), visible: true, minWidth: 80, maxWidth: 100, order: 2 },
  { id: 'nhom_chien_luoc', label: i18n.t('chienLuoc.col.nhomChienLuoc'), visible: true, minWidth: 140, maxWidth: 220, order: 3 },
  { id: 'trang_thai_duyet', label: i18n.t('chienLuoc.col.trangThaiDuyet'), visible: true, minWidth: 110, maxWidth: 140, order: 4 },
  { id: 'trang_thai_trien_khai', label: i18n.t('chienLuoc.col.trangThaiTrienKhai'), visible: true, minWidth: 120, maxWidth: 160, order: 5 },
  { id: 'ngay_bat_dau', label: i18n.t('chienLuoc.col.ngayBatDau'), visible: true, minWidth: 100, maxWidth: 120, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('chienLuoc.col.tgCapNhat'), visible: true, minWidth: 100, maxWidth: 130, order: 7 },
];

const initialFilters: ChienLuocFilters = {
  nam: null,
  trang_thai_duyet: [],
  trang_thai_trien_khai: [],
};

export const useChienLuocStore = createGenericStore<ChienLuocFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
