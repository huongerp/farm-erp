import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface HangHoaFilters {
  status: string[];
  /** Danh mục cấp 1 (cha). */
  id_danh_muc_cha: string[];
  /** Danh mục cấp 2 (con). */
  id_danh_muc: string[];
  /** Đơn vị tính. */
  dvt: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: i18n.t('hangHoa.store.orderCol'), visible: true, minWidth: 80, maxWidth: 100, order: 0 },
  { id: 'ma_hang_hoa', label: i18n.t('hangHoa.store.codeCol'), visible: true, minWidth: 120, maxWidth: 180, order: 1 },
  { id: 'ten_hang_hoa', label: i18n.t('hangHoa.store.nameCol'), visible: true, minWidth: 180, maxWidth: 320, order: 2 },
  { id: 'ten_danh_muc', label: i18n.t('hangHoa.store.categoryCol'), visible: true, minWidth: 160, maxWidth: 280, order: 3 },
  { id: 'dvt', label: i18n.t('hangHoa.store.unitCol'), visible: true, minWidth: 80, maxWidth: 120, order: 4 },
  { id: 'don_gia', label: i18n.t('hangHoa.store.priceCol'), visible: true, minWidth: 100, maxWidth: 140, order: 5 },
  { id: 'tong_dinh_muc', label: i18n.t('hangHoa.store.tongDinhMucCol'), visible: true, minWidth: 120, maxWidth: 160, order: 6 },
  { id: 'so_kho_dinh_muc', label: i18n.t('hangHoa.store.soKhoDinhMucCol'), visible: true, minWidth: 100, maxWidth: 140, order: 7 },
  { id: 'trang_thai', label: i18n.t('hangHoa.store.statusCol'), visible: true, minWidth: 100, maxWidth: 140, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('hangHoa.store.updatedCol'), visible: true, minWidth: 100, maxWidth: 140, order: 9 },
];

const initialFilters: HangHoaFilters = {
  status: [],
  id_danh_muc_cha: [],
  id_danh_muc: [],
  dvt: [],
};

export const useHangHoaStore = createGenericStore<HangHoaFilters>(initialFilters, DEFAULT_COLUMNS);
