import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface FarmHangHoaFilters {
  id_danh_muc_cha: string[];
  id_danh_muc: string[];
  dvt: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_hang_hoa', label: i18n.t('farmHangHoaPhanThuoc.hangHoa.store.codeCol'), visible: true, minWidth: 120, maxWidth: 180, order: 0 },
  { id: 'ten_hang_hoa', label: i18n.t('farmHangHoaPhanThuoc.hangHoa.store.nameCol'), visible: true, minWidth: 180, maxWidth: 320, order: 1 },
  { id: 'ten_danh_muc', label: i18n.t('farmHangHoaPhanThuoc.hangHoa.store.categoryCol'), visible: true, minWidth: 160, maxWidth: 280, order: 2 },
  { id: 'dvt', label: i18n.t('farmHangHoaPhanThuoc.hangHoa.store.unitCol'), visible: true, minWidth: 80, maxWidth: 120, order: 3 },
  { id: 'don_gia', label: i18n.t('farmHangHoaPhanThuoc.hangHoa.store.priceCol'), visible: true, minWidth: 100, maxWidth: 140, order: 4 },
  { id: 'mo_ta', label: i18n.t('farmHangHoaPhanThuoc.hangHoa.store.descCol'), visible: true, minWidth: 140, maxWidth: 280, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('farmHangHoaPhanThuoc.hangHoa.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 6 },
];

const initialFilters: FarmHangHoaFilters = {
  id_danh_muc_cha: [],
  id_danh_muc: [],
  dvt: [],
};

export const useFarmHangHoaStore = createGenericStore<FarmHangHoaFilters>(initialFilters, DEFAULT_COLUMNS);
