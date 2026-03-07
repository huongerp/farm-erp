import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface CongViecFilters {
  id_du_an: string[];
  trang_thai: string[];
  uu_tien: string[];
  nguoi_thuc_hien: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_cong_viec', label: i18n.t('congViec.store.maCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'tieu_de', label: i18n.t('congViec.store.tieuDeCol'), visible: true, minWidth: 220, order: 1 },
  { id: 'ten_du_an', label: i18n.t('congViec.store.duAnCol'), visible: true, minWidth: 140, order: 2 },
  { id: 'uu_tien', label: i18n.t('congViec.store.uuTienCol'), visible: true, minWidth: 100, order: 3 },
  { id: 'trang_thai', label: i18n.t('congViec.store.trangThaiCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'ngay_het_han', label: i18n.t('congViec.store.ngayHetHanCol'), visible: true, minWidth: 110, order: 5 },
  { id: 'phan_tram_hoan_thanh', label: i18n.t('congViec.store.tienDoCol'), visible: true, minWidth: 90, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('congViec.store.updatedCol'), visible: false, minWidth: 140, order: 7 },
];

const initialFilters: CongViecFilters = {
  id_du_an: [],
  trang_thai: [],
  uu_tien: [],
  nguoi_thuc_hien: [],
};

export const useCongViecStore = createGenericStore<CongViecFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
