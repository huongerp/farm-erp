import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface BaoTriSuaChuaFilters {
  hang_muc: string[];
  dateFrom: string;
  dateTo: string;
  id_tai_san: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('baoTriSuaChua.store.ngayCol'), visible: true, minWidth: 110, order: 0 },
  { id: 'ten_hang_muc', label: i18n.t('baoTriSuaChua.store.hangMucCol'), visible: true, minWidth: 100, order: 1 },
  { id: 'ma_phieu', label: i18n.t('baoTriSuaChua.store.maPhieuCol'), visible: true, minWidth: 120, order: 2 },
  { id: 'ten_tai_san', label: i18n.t('baoTriSuaChua.store.taiSanCol'), visible: true, minWidth: 160, order: 3 },
  { id: 'mo_ta', label: i18n.t('baoTriSuaChua.store.moTaCol'), visible: true, minWidth: 180, order: 4 },
  { id: 'so_tien', label: i18n.t('baoTriSuaChua.store.soTienCol'), visible: true, minWidth: 110, order: 5 },
  { id: 'trang_thai', label: i18n.t('baoTriSuaChua.store.trangThaiCol'), visible: true, minWidth: 110, order: 6 },
  { id: 'nguoi_duyet', label: i18n.t('baoTriSuaChua.store.nguoiDuyetCol'), visible: true, minWidth: 120, order: 7 },
  { id: 'tg_cap_nhat', label: i18n.t('baoTriSuaChua.store.updatedCol'), visible: true, minWidth: 130, order: 8 },
];

const initialFilters: BaoTriSuaChuaFilters = {
  hang_muc: [],
  dateFrom: '',
  dateTo: '',
  id_tai_san: [],
};

export const useBaoTriSuaChuaStore = createGenericStore<BaoTriSuaChuaFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
