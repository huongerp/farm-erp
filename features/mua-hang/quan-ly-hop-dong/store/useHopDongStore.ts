import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { HopDongFilters } from '../core/types';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_hop_dong', label: i18n.t('hopDong.store.maCol'), visible: true, minWidth: 120, maxWidth: 160, order: 0 },
  { id: 'ten_hop_dong', label: i18n.t('hopDong.store.tenCol'), visible: true, minWidth: 200, maxWidth: 340, order: 1 },
  { id: 'ngay', label: i18n.t('hopDong.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 120, order: 2 },
  { id: 'ten_nha_cung_cap', label: i18n.t('hopDong.store.nccCol'), visible: true, minWidth: 200, maxWidth: 320, order: 3 },
  { id: 'so_luong_cay', label: i18n.t('hopDong.store.soLuongCayCol'), visible: true, minWidth: 100, maxWidth: 120, order: 4 },
  { id: 'thanh_tien', label: i18n.t('hopDong.store.thanhTienCol'), visible: true, minWidth: 120, maxWidth: 140, order: 5 },
  { id: 'so_dot_thanh_toan', label: i18n.t('hopDong.store.soDotCol'), visible: true, minWidth: 88, maxWidth: 100, order: 6 },
  { id: 'tong_da_thanh_toan', label: i18n.t('hopDong.store.tongDaThanhToanCol'), visible: true, minWidth: 120, maxWidth: 140, order: 7 },
  { id: 'tong_cay_da_giao', label: i18n.t('hopDong.store.tongCayDaGiaoCol'), visible: true, minWidth: 120, maxWidth: 140, order: 8 },
  { id: 'tien_con_lai', label: i18n.t('hopDong.store.tienConLaiCol'), visible: true, minWidth: 120, maxWidth: 140, order: 9 },
  { id: 'cay_con_lai', label: i18n.t('hopDong.store.cayConLaiCol'), visible: true, minWidth: 120, maxWidth: 140, order: 10 },
  { id: 'hinh_anh', label: i18n.t('hopDong.store.hinhAnhCol'), visible: true, minWidth: 72, maxWidth: 96, order: 11 },
  { id: 'trang_thai', label: i18n.t('hopDong.store.trangThaiCol'), visible: true, minWidth: 120, maxWidth: 140, order: 12 },
  { id: 'ten_nguoi_tao', label: i18n.t('hopDong.store.nguoiTaoCol'), visible: true, minWidth: 120, maxWidth: 180, order: 13 },
  { id: 'tg_cap_nhat', label: i18n.t('hopDong.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 14 },
];

const initialFilters: HopDongFilters = {
  trangThai: [],
  nccIds: [],
  dateFrom: '',
  dateTo: '',
  nguoiTaoIds: [],
};

export const useHopDongStore = createGenericStore<HopDongFilters>(initialFilters, DEFAULT_COLUMNS);
