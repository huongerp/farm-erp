import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface BaoCaoNhanCongFilters {
  id_chi_nhanh: string[];
  /** Năm (yyyy) từ cột ngày */
  nam: string[];
  /** Tháng (yyyy-mm) từ cột ngày */
  thang: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('baoCaoNhanCong.store.colNgay'), visible: true, minWidth: 110, maxWidth: 130, order: 0 },
  { id: 'ten_chi_nhanh', label: i18n.t('baoCaoNhanCong.store.colBranch'), visible: true, minWidth: 140, maxWidth: 220, order: 1 },
  {
    id: 'tong_cong_ngay',
    label: i18n.t('baoCaoNhanCong.store.colTongCongNgay'),
    visible: true,
    minWidth: 120,
    maxWidth: 140,
    order: 2,
  },
  {
    id: 'ghi_chu',
    label: i18n.t('baoCaoNhanCong.store.colGhiChu'),
    visible: true,
    minWidth: 220,
    maxWidth: 420,
    order: 3,
  },
  { id: 'ten_nguoi_tao', label: i18n.t('baoCaoNhanCong.store.colNguoiTao'), visible: true, minWidth: 128, maxWidth: 200, order: 4 },
  { id: 'tg_cap_nhat', label: i18n.t('baoCaoNhanCong.store.colUpdated'), visible: true, minWidth: 100, maxWidth: 140, order: 5 },
];

const initialFilters: BaoCaoNhanCongFilters = {
  id_chi_nhanh: [],
  nam: [],
  thang: [],
};

export const useBaoCaoNhanCongStore = createGenericStore<BaoCaoNhanCongFilters>(initialFilters, DEFAULT_COLUMNS);
