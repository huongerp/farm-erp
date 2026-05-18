import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DuBaoSlDongThungFilters {
  id_chi_nhanh: string[];
  nam: string[];
  thang: string[];
  trang_thai: string[];
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
  { id: 'tong_buong_nhap_ke_hoach', label: i18n.t('duBaoSlDongThung.store.colBuongNhapKh'), visible: false, minWidth: 112, maxWidth: 150, order: 9 },
  { id: 'tong_buong_nhap_thuc_te', label: i18n.t('duBaoSlDongThung.store.colBuongNhapTt'), visible: false, minWidth: 112, maxWidth: 150, order: 10 },
  { id: 'ty_le_thu_hoi_ke_hoach', label: i18n.t('duBaoSlDongThung.store.colTyLeThuHoiKh'), visible: false, minWidth: 100, maxWidth: 130, order: 11 },
  { id: 'ty_le_thu_hoi_thuc_te', label: i18n.t('duBaoSlDongThung.store.colTyLeThuHoiTt'), visible: false, minWidth: 100, maxWidth: 130, order: 12 },
  { id: 'quy_cach_dong_thung_ke_hoach', label: i18n.t('duBaoSlDongThung.store.colQuyCachKh'), visible: false, minWidth: 100, maxWidth: 130, order: 13 },
  { id: 'quy_cach_dong_thung_thuc_te', label: i18n.t('duBaoSlDongThung.store.colQuyCachTt'), visible: false, minWidth: 100, maxWidth: 130, order: 14 },
  { id: 'can_nang_binh_quan_buong', label: i18n.t('duBaoSlDongThung.store.colCanBqBuong'), visible: false, minWidth: 110, maxWidth: 140, order: 15 },
];

const initialFilters: DuBaoSlDongThungFilters = {
  id_chi_nhanh: [],
  nam: [],
  thang: [],
  trang_thai: [],
};

export const useDuBaoSlDongThungStore = createGenericStore<DuBaoSlDongThungFilters>(initialFilters, DEFAULT_COLUMNS);
