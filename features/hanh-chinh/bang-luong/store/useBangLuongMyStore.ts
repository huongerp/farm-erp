import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface BangLuongMyFilters {
  yearMonth: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'period', label: i18n.t('bangLuong.store.periodCol'), visible: true, minWidth: 100, order: 0 },
  { id: 'ten_phong_ban', label: i18n.t('bangLuong.store.departmentCol'), visible: true, minWidth: 140, order: 1 },
  { id: 'ngay_cong', label: i18n.t('bangLuong.store.ngayCongCol'), visible: true, minWidth: 90, order: 2 },
  { id: 'luong_co_ban_tinh', label: i18n.t('bangLuong.store.luongCoBanTinhCol'), visible: true, minWidth: 120, order: 3 },
  { id: 'luong_kpi_tinh', label: i18n.t('bangLuong.store.luongKpiTinhCol'), visible: true, minWidth: 110, order: 4 },
  { id: 'luong_trach_nhiem_tinh', label: i18n.t('bangLuong.store.luongTrachNhiemTinhCol'), visible: true, minWidth: 130, order: 5 },
  { id: 'phu_cap_tinh', label: i18n.t('bangLuong.store.phuCapTinhCol'), visible: true, minWidth: 100, order: 6 },
  { id: 'cong_tru_net', label: i18n.t('bangLuong.store.congTruNetCol'), visible: true, minWidth: 100, order: 7 },
  { id: 'tong_luong', label: i18n.t('bangLuong.store.tongLuongCol'), visible: true, minWidth: 120, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('bangLuong.store.updatedCol'), visible: false, minWidth: 130, order: 9 },
];

const initialFilters: BangLuongMyFilters = {
  yearMonth: '',
};

export const useBangLuongMyStore = createGenericStore<BangLuongMyFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
