import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface BaoTriSuaChuaFilters {
  hang_muc: string[];
  dateFrom: string;
  dateTo: string;
  id_tai_san: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'hang_muc', label: i18n.t('baoTriSuaChua.store.hangMucCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'ten_tai_san', label: i18n.t('baoTriSuaChua.store.taiSanCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'ngay_yeu_cau', label: i18n.t('baoTriSuaChua.store.ngayYeuCauCol'), visible: true, minWidth: 110, order: 2 },
  { id: 'ngay_hen', label: i18n.t('baoTriSuaChua.store.ngayHenCol'), visible: true, minWidth: 110, order: 3 },
  { id: 'ten_nguoi_phu_trach', label: i18n.t('baoTriSuaChua.store.nguoiPhuTrachCol'), visible: true, minWidth: 130, order: 4 },
  { id: 'trang_thai', label: i18n.t('baoTriSuaChua.store.trangThaiCol'), visible: true, minWidth: 100, order: 5 },
  { id: 'mo_ta', label: i18n.t('baoTriSuaChua.store.moTaCol'), visible: false, minWidth: 180, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('baoTriSuaChua.store.updatedCol'), visible: true, minWidth: 130, order: 7 },
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
