import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DuBaoSlDongThungFilters {
  id_chi_nhanh: string[];
  nam: string[];
  thang: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('duBaoSlDongThung.store.colNgay'), visible: true, minWidth: 110, maxWidth: 130, order: 0 },
  { id: 'ten_chi_nhanh', label: i18n.t('duBaoSlDongThung.store.colBranch'), visible: true, minWidth: 140, maxWidth: 220, order: 1 },
  {
    id: 'trang_thai',
    label: i18n.t('duBaoSlDongThung.store.colTrangThai'),
    visible: true,
    minWidth: 116,
    maxWidth: 180,
    order: 2,
  },
  {
    id: 'tong_so_thung_ke_hoach',
    label: i18n.t('duBaoSlDongThung.store.colTongSoThungKeHoach'),
    visible: true,
    minWidth: 112,
    maxWidth: 140,
    order: 3,
  },
  {
    id: 'tong_so_thung_thuc_te',
    label: i18n.t('duBaoSlDongThung.store.colTongSoThungThucTe'),
    visible: true,
    minWidth: 112,
    maxWidth: 140,
    order: 4,
  },
  {
    id: 'ghi_chu',
    label: i18n.t('duBaoSlDongThung.store.colGhiChu'),
    visible: true,
    minWidth: 200,
    maxWidth: 380,
    order: 5,
  },
  { id: 'ten_nguoi_tao', label: i18n.t('duBaoSlDongThung.store.colNguoiTao'), visible: true, minWidth: 128, maxWidth: 200, order: 6 },
  {
    id: 'tg_tao',
    label: i18n.t('duBaoSlDongThung.store.colTgTao'),
    visible: true,
    minWidth: 132,
    maxWidth: 168,
    order: 7,
  },
  { id: 'tg_cap_nhat', label: i18n.t('duBaoSlDongThung.store.colUpdated'), visible: true, minWidth: 132, maxWidth: 168, order: 8 },
];

const initialFilters: DuBaoSlDongThungFilters = {
  id_chi_nhanh: [],
  nam: [],
  thang: [],
};

export const useDuBaoSlDongThungStore = createGenericStore<DuBaoSlDongThungFilters>(initialFilters, DEFAULT_COLUMNS);
