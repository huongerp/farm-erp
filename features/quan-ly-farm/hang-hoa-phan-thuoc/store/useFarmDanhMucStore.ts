import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface FarmDanhMucFilters {}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('farmHangHoaPhanThuoc.danhMuc.store.orderCol'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'ten_danh_muc', label: i18n.t('farmHangHoaPhanThuoc.danhMuc.store.nameCol'), visible: true, minWidth: 180, maxWidth: 320, order: 1 },
  { id: 'ma_danh_muc', label: i18n.t('farmHangHoaPhanThuoc.danhMuc.store.codeCol'), visible: true, minWidth: 120, maxWidth: 180, order: 2 },
  { id: 'ten_cha', label: i18n.t('farmHangHoaPhanThuoc.danhMuc.store.tenCha'), visible: true, minWidth: 140, maxWidth: 260, order: 3 },
  { id: 'mo_ta', label: i18n.t('farmHangHoaPhanThuoc.danhMuc.store.descCol'), visible: true, minWidth: 160, maxWidth: 280, order: 4 },
  { id: 'tg_cap_nhat', label: i18n.t('farmHangHoaPhanThuoc.danhMuc.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 5 },
];

const initialFilters: FarmDanhMucFilters = {};

export const useFarmDanhMucStore = createGenericStore<FarmDanhMucFilters>(initialFilters, DEFAULT_COLUMNS);
