import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface KiemKeKhoFilters {
  trang_thai_dot: string[];
  dateFrom: string;
  dateTo: string;
  id_nguoi_phu_trach: string[];
  id_kho: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_dot', label: i18n.t('kiemKeKho.store.maDotCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'ten_dot', label: i18n.t('kiemKeKho.store.tenDotCol'), visible: true, minWidth: 180, order: 1 },
  { id: 'ngay_bat_dau', label: i18n.t('kiemKeKho.store.ngayBatDauCol'), visible: true, minWidth: 110, order: 2 },
  { id: 'ngay_ket_thuc', label: i18n.t('kiemKeKho.store.ngayKetThucCol'), visible: true, minWidth: 110, order: 3 },
  { id: 'trang_thai', label: i18n.t('kiemKeKho.store.trangThaiCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'so_kho', label: i18n.t('kiemKeKho.store.soKhoCol'), visible: true, minWidth: 80, order: 5 },
  { id: 'so_hang_hoa', label: i18n.t('kiemKeKho.store.soHangHoaCol'), visible: true, minWidth: 100, order: 6 },
  { id: 'so_lech', label: i18n.t('kiemKeKho.store.soLechCol'), visible: true, minWidth: 80, order: 7 },
  { id: 'ten_nguoi_phu_trach', label: i18n.t('kiemKeKho.store.nguoiPhuTrachCol'), visible: true, minWidth: 140, order: 8 },
  { id: 'ghi_chu', label: i18n.t('kiemKeKho.store.ghiChuCol'), visible: false, minWidth: 160, order: 9 },
  { id: 'tg_cap_nhat', label: i18n.t('kiemKeKho.store.updatedCol'), visible: true, minWidth: 130, order: 10 },
];

const initialFilters: KiemKeKhoFilters = {
  trang_thai_dot: [],
  dateFrom: '',
  dateTo: '',
  id_nguoi_phu_trach: [],
  id_kho: [],
};

export const useKiemKeKhoStore = createGenericStore<KiemKeKhoFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
