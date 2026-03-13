import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface CongViecFilters {
  trang_thai: string[];
  uu_tien: string[];
  trach_nhiem: number[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'tieu_de', label: i18n.t('congViec.store.tieuDeCol'), visible: true, minWidth: 200, order: 0 },
  { id: 'mo_ta', label: i18n.t('congViec.store.moTaCol'), visible: true, minWidth: 180, order: 1 },
  { id: 'id_nguoi_giao', label: i18n.t('congViec.form.nguoiGiao'), visible: true, minWidth: 120, order: 2 },
  { id: 'trach_nhiem', label: i18n.t('congViec.form.trachNhiem'), visible: true, minWidth: 120, order: 3 },
  { id: 'nguoi_ho_tro', label: i18n.t('congViec.store.nguoiHoTroCol'), visible: true, minWidth: 140, order: 4 },
  { id: 'uu_tien', label: i18n.t('congViec.store.uuTienCol'), visible: true, minWidth: 96, order: 5 },
  { id: 'trang_thai', label: i18n.t('congViec.store.trangThaiCol'), visible: true, minWidth: 110, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('congViec.store.updatedCol'), visible: true, minWidth: 128, order: 7 },
];

const initialFilters: CongViecFilters = {
  trang_thai: [],
  uu_tien: [],
  trach_nhiem: [],
};

export const useCongViecStore = createGenericStore<CongViecFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
