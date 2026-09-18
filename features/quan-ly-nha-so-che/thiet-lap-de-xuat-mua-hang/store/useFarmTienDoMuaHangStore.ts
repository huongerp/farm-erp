import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface FarmTienDoMuaHangFilters {
  status: string[];
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma', label: i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.store.maCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'ten', label: i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.store.tenCol'), visible: true, minWidth: 140, order: 1 },
  { id: 'thu_tu', label: i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.store.thuTuCol'), visible: true, minWidth: 90, order: 2 },
  { id: 'mau', label: i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.store.mauCol'), visible: true, minWidth: 100, order: 3 },
  { id: 'ghi_chu', label: i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.store.noteCol'), visible: true, minWidth: 180, order: 4 },
  { id: 'trang_thai', label: i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.store.statusCol'), visible: true, minWidth: 110, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.store.updatedCol'), visible: false, minWidth: 140, order: 6 },
];

export const useFarmTienDoMuaHangStore = createGenericStore<FarmTienDoMuaHangFilters>({ status: [] }, DEFAULT_COLUMNS, 'table-thiet-lap-de-xuat-mua-hang-farm-tien-do-mua-hang');
