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
    id: 'trang_thai',
    label: i18n.t('baoCaoNhanCong.store.colTrangThai'),
    visible: true,
    minWidth: 116,
    maxWidth: 180,
    order: 2,
  },
  {
    id: 'tong_cong_ngay',
    label: i18n.t('baoCaoNhanCong.store.colTongCongNgay'),
    visible: true,
    minWidth: 112,
    maxWidth: 136,
    order: 3,
  },
  {
    id: 'tong_cong_nua',
    label: i18n.t('baoCaoNhanCong.store.colTongCongNua'),
    visible: true,
    minWidth: 112,
    maxWidth: 136,
    order: 4,
  },
  {
    id: 'tong_tang_ca',
    label: i18n.t('baoCaoNhanCong.store.colTongTangCa'),
    visible: true,
    minWidth: 112,
    maxWidth: 136,
    order: 5,
  },
  {
    id: 'tong_gio_tc',
    label: i18n.t('baoCaoNhanCong.store.colTongGioTc'),
    visible: true,
    minWidth: 100,
    maxWidth: 120,
    order: 6,
  },
  {
    id: 'ghi_chu',
    label: i18n.t('baoCaoNhanCong.store.colGhiChu'),
    visible: true,
    minWidth: 200,
    maxWidth: 380,
    order: 7,
  },
  { id: 'ten_nguoi_tao', label: i18n.t('baoCaoNhanCong.store.colNguoiTao'), visible: true, minWidth: 128, maxWidth: 200, order: 8 },
  {
    id: 'tg_tao',
    label: i18n.t('baoCaoNhanCong.store.colTgTao'),
    visible: true,
    minWidth: 132,
    maxWidth: 168,
    order: 9,
  },
  { id: 'tg_cap_nhat', label: i18n.t('baoCaoNhanCong.store.colUpdated'), visible: true, minWidth: 132, maxWidth: 168, order: 10 },
];

const initialFilters: BaoCaoNhanCongFilters = {
  id_chi_nhanh: [],
  nam: [],
  thang: [],
};

export const useBaoCaoNhanCongStore = createGenericStore<BaoCaoNhanCongFilters>(initialFilters, DEFAULT_COLUMNS);
