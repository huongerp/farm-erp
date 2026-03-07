import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface HanhDongCotLoiFilters {
  id_chien_luoc: string | null;
  nam: number | null;
  bsc_dimension: string | null;
  nhom_hanh_dong: string | null;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'chien_luoc', label: i18n.t('hanhDongCotLoi.col.chienLuoc'), visible: true, minWidth: 180, maxWidth: 280, order: 0 },
  { id: 'ma', label: i18n.t('hanhDongCotLoi.col.ma'), visible: true, minWidth: 90, maxWidth: 120, order: 1 },
  { id: 'ten', label: i18n.t('hanhDongCotLoi.col.ten'), visible: true, minWidth: 180, maxWidth: 300, order: 2 },
  { id: 'bsc_dimension', label: i18n.t('hanhDongCotLoi.col.bsc'), visible: true, minWidth: 120, maxWidth: 180, order: 3 },
  { id: 'nhom_hanh_dong', label: i18n.t('hanhDongCotLoi.col.nhomHanhDong'), visible: true, minWidth: 120, maxWidth: 160, order: 4 },
  { id: 'ty_trong', label: i18n.t('hanhDongCotLoi.col.tyTrong'), visible: true, minWidth: 80, maxWidth: 100, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('hanhDongCotLoi.col.tgCapNhat'), visible: true, minWidth: 100, maxWidth: 130, order: 6 },
];

const initialFilters: HanhDongCotLoiFilters = {
  id_chien_luoc: null,
  nam: null,
  bsc_dimension: null,
  nhom_hanh_dong: null,
};

export const useHanhDongCotLoiStore = createGenericStore<HanhDongCotLoiFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
