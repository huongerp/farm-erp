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
    id: 'hinh_anh',
    label: i18n.t('baoCaoNhanCong.store.colHinhAnh'),
    visible: true,
    minWidth: 52,
    maxWidth: 64,
    order: 3,
  },
  {
    id: 'tong_cong_ngay',
    label: i18n.t('baoCaoNhanCong.store.colTongCongNgay'),
    visible: true,
    minWidth: 112,
    maxWidth: 136,
    order: 4,
  },
  {
    id: 'tong_cong_nua',
    label: i18n.t('baoCaoNhanCong.store.colTongCongNua'),
    visible: true,
    minWidth: 112,
    maxWidth: 136,
    order: 5,
  },
  {
    id: 'tong_cong_quy_doi',
    label: i18n.t('baoCaoNhanCong.store.colTongCongQuyDoi'),
    visible: true,
    minWidth: 96,
    maxWidth: 120,
    order: 6,
  },
  {
    id: 'tong_tang_ca',
    label: i18n.t('baoCaoNhanCong.store.colTongTangCa'),
    visible: true,
    minWidth: 112,
    maxWidth: 136,
    order: 7,
  },
  {
    id: 'tong_gio_tc',
    label: i18n.t('baoCaoNhanCong.store.colGioTangCa'),
    visible: true,
    minWidth: 88,
    maxWidth: 112,
    order: 8,
  },
  {
    id: 'tong_gio_tang_ca_tich',
    label: i18n.t('baoCaoNhanCong.store.colTongGioTangCa'),
    visible: true,
    minWidth: 96,
    maxWidth: 124,
    order: 9,
  },
  {
    id: 'tong_thuong_kpi',
    label: i18n.t('baoCaoNhanCong.store.colTongThuongKpi'),
    visible: true,
    minWidth: 104,
    maxWidth: 132,
    order: 10,
  },
  {
    id: 'ghi_chu',
    label: i18n.t('baoCaoNhanCong.store.colGhiChu'),
    visible: true,
    minWidth: 200,
    maxWidth: 380,
    order: 11,
  },
  { id: 'ten_nguoi_tao', label: i18n.t('baoCaoNhanCong.store.colNguoiTao'), visible: true, minWidth: 128, maxWidth: 200, order: 12 },
  {
    id: 'tg_tao',
    label: i18n.t('baoCaoNhanCong.store.colTgTao'),
    visible: true,
    minWidth: 132,
    maxWidth: 168,
    order: 13,
  },
  { id: 'tg_cap_nhat', label: i18n.t('baoCaoNhanCong.store.colUpdated'), visible: true, minWidth: 132, maxWidth: 168, order: 14 },
];

const initialFilters: BaoCaoNhanCongFilters = {
  id_chi_nhanh: [],
  nam: [],
  thang: [],
};

export const useBaoCaoNhanCongStore = createGenericStore<BaoCaoNhanCongFilters>(initialFilters, DEFAULT_COLUMNS);
