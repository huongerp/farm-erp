import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface BaoCaoSoCheFilters {
  id_chi_nhanh: string[];
  nam: string[];
  thang: string[];
  trang_thai: string[];
  don_vi_tinh: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'stt', label: i18n.t('baoCaoSoChe.store.colStt'), visible: true, minWidth: 48, maxWidth: 64, order: 0 },
  { id: 'ngay', label: i18n.t('baoCaoSoChe.store.colNgay'), visible: true, minWidth: 110, maxWidth: 130, order: 1 },
  { id: 'ten_chi_nhanh', label: i18n.t('baoCaoSoChe.store.colBranch'), visible: true, minWidth: 140, maxWidth: 220, order: 2 },
  {
    id: 'trang_thai',
    label: i18n.t('baoCaoSoChe.store.colTrangThai'),
    visible: true,
    minWidth: 116,
    maxWidth: 180,
    order: 3,
  },
  { id: 'don_vi_tinh', label: i18n.t('baoCaoSoChe.store.colDvt'), visible: true, minWidth: 72, maxWidth: 100, order: 4 },
  {
    id: 'sl_buong_ton_dau_ngay',
    label: i18n.t('baoCaoSoChe.store.colTonDau'),
    visible: true,
    minWidth: 112,
    maxWidth: 140,
    order: 5,
  },
  {
    id: 'tong_buong_thu_hoach',
    label: i18n.t('baoCaoSoChe.store.colThuHoach'),
    visible: true,
    minWidth: 112,
    maxWidth: 140,
    order: 6,
  },
  {
    id: 'tong_buong_khong_so_che',
    label: i18n.t('baoCaoSoChe.store.colKhongSoChe'),
    visible: true,
    minWidth: 112,
    maxWidth: 140,
    order: 7,
  },
  {
    id: 'tong_buong_so_che',
    label: i18n.t('baoCaoSoChe.store.colSoChe'),
    visible: true,
    minWidth: 112,
    maxWidth: 140,
    order: 8,
  },
  {
    id: 'sl_buong_ton_cuoi_ngay',
    label: i18n.t('baoCaoSoChe.store.colTonCuoi'),
    visible: true,
    minWidth: 112,
    maxWidth: 140,
    order: 9,
  },
  {
    id: 'danh_gia_loi_qc_pct',
    label: i18n.t('baoCaoSoChe.store.colDanhGiaLoiQc'),
    visible: true,
    minWidth: 100,
    maxWidth: 130,
    order: 10,
  },
  {
    id: 'tong_thung_pham_cap',
    label: i18n.t('baoCaoSoChe.store.colTongThungPc'),
    visible: false,
    minWidth: 108,
    maxWidth: 140,
    order: 11,
  },
  {
    id: 'tong_kg_pham_cap',
    label: i18n.t('baoCaoSoChe.store.colTongKgPc'),
    visible: false,
    minWidth: 108,
    maxWidth: 140,
    order: 12,
  },
  {
    id: 'nang_suat_thuc_te',
    label: i18n.t('baoCaoSoChe.store.colNangSuatTt'),
    visible: false,
    minWidth: 108,
    maxWidth: 140,
    order: 13,
  },
  {
    id: 'tong_thuong_kpi',
    label: i18n.t('baoCaoSoChe.store.colTongThuongKpi'),
    visible: true,
    minWidth: 112,
    maxWidth: 140,
    order: 14,
  },
  {
    id: 'ghi_chu',
    label: i18n.t('baoCaoSoChe.store.colGhiChu'),
    visible: true,
    minWidth: 160,
    maxWidth: 320,
    order: 15,
  },
  { id: 'ten_nguoi_tao', label: i18n.t('baoCaoSoChe.store.colNguoiTao'), visible: true, minWidth: 128, maxWidth: 200, order: 16 },
  { id: 'tg_tao', label: i18n.t('baoCaoSoChe.store.colTgTao'), visible: true, minWidth: 132, maxWidth: 168, order: 17 },
  { id: 'tg_cap_nhat', label: i18n.t('baoCaoSoChe.store.colUpdated'), visible: true, minWidth: 132, maxWidth: 168, order: 18 },
];

const initialFilters: BaoCaoSoCheFilters = {
  id_chi_nhanh: [],
  nam: [],
  thang: [],
  trang_thai: [],
  don_vi_tinh: [],
};

export const useBaoCaoSoCheStore = createGenericStore<BaoCaoSoCheFilters>(initialFilters, DEFAULT_COLUMNS);
